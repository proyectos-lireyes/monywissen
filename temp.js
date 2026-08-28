    
    // 1. Process Incomes and Strict Expenses
    let incomes = dayEvents.filter(e => e.amt >= 0);
    let strictOut = dayEvents.filter(e => e.amt < 0 && (e.done || (e.ref?.strictDate && e.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => e.amt < 0 && !e.done && !(e.ref?.strictDate && e.type !== 'savings') && !(e.type === 'savings' && d < todayStr()));
    let missedSavings = dayEvents.filter(e => e.amt < 0 && !e.done && e.type === 'savings' && d < todayStr());
    
    const applied: any[] = [];
    
    for (const e of incomes) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }
    for (const e of strictOut) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }
    for (const e of missedSavings) {
        applied.push({ ...e, date: d, amt: 0, label: `${e.label} (Omitido)`, runningBalance: balance, isDiscarded: true });
    }
    
    // Add today's flexible expenses to the pending backlog
    delayedItems.push(...flexibleOut);
    
    const isProcessingDay = incomes.length > 0 || d === startD;
    
    // 2. Process Flexible Expenses ONLY on Income Days (or Start Date)
    if (isProcessingDay) {
       const nextIncome = futureEvents.find(e => e.originalDate > d && e.amt > 0 && e.type === 'income');
       const nextIncomeDate = nextIncome ? nextIncome.originalDate : null;
       
       // Gather all upcoming flexible expenses up to (but not including) the next income date
       const upcoming = futureEvents.filter(e => 
           e.originalDate > d && 
           (nextIncomeDate ? e.originalDate < nextIncomeDate : true) && 
           e.amt < 0 && 
           !e.done && 
           !e.ref?.strictDate &&
           !e.pulledEarly
       );
       
       // Combine pending backlog and upcoming items
       let candidates = [...delayedItems, ...upcoming];
       candidates.sort((a, b) => a.originalDate.localeCompare(b.originalDate) || Math.abs(a.amt) - Math.abs(b.amt));
       
       let newDelayed: any[] = [];
       
       for (const e of candidates) {
          const isDue = e.originalDate <= d;
          const available = isDue ? balance + savingsAccumulated : balance;

          if (available + e.amt >= targetMin) {
             if (e.originalDate > d) {
                 e.pulledEarly = true;
             } else if (e.originalDate < d) {
                 e.isDelayed = true;
             }
             e.optimizedFrom = e.originalDate;
             balance += e.amt;
             applied.push({ ...e, date: d, runningBalance: balance });
          } else {
             // If we can't pay it, it waits. Only mark it delayed if its original date has passed or is today.
             if (isDue) {
                 e.isDelayed = true;
                 e.optimizedFrom = e.originalDate;
                 newDelayed.push(e);
             }
             // If it's in the future, we just leave it alone so it gets processed naturally.
          }
       }
       delayedItems = newDelayed;
    }
    
    // First, process savings accumulations so they are available for rescue
    applied.forEach(e => {
      if (e.type === 'savings' && e.amt < 0) {
        savingsAccumulated += Math.abs(e.amt);
      }
    });

    // Auto-withdraw from savings if strict items broke the cushion
    let rescueEvent = null;
    if (balance < targetMin && savingsAccumulated > 0) {
      const autowithdrawKey = `income_autowithdraw_${d}_${d}`;
      const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
      
      if (!isDiscarded) {
          const deficit = targetMin - balance;
          const amountToWithdraw = Math.min(deficit, savingsAccumulated);
          balance += amountToWithdraw;
          savingsAccumulated -= amountToWithdraw;
          
          rescueEvent = {
            date: d,
            label: 'Rescate de Ahorros',
            type: 'income',
            amt: amountToWithdraw,
            ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
            originalDate: d,
            done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
            balance,
            isDelayed: false,
            insufficientFunds: false,
            savingsAccumulated,
          };
      }
    }

    // Finalize applied events WITH running balance
    applied.forEach(e => {
      const stepBalance = e.runningBalance !== undefined ? e.runningBalance : balance;
      plan.push({
        ...e,
        balance: stepBalance,
        insufficientFunds: stepBalance < targetMin,
        savingsAccumulated,
