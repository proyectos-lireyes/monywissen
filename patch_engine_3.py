import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

pattern = re.compile(r'    // Incomes first, then strict expenses, then flexible expenses.*?    // Finalize applied events', re.DOTALL)

replacement = """    // 1. Process Incomes and Strict Expenses
    let incomes = dayEvents.filter(e => e.amt >= 0);
    let strictOut = dayEvents.filter(e => e.amt < 0 && (e.done || e.ref?.strictDate));
    let flexibleOut = dayEvents.filter(e => e.amt < 0 && !e.done && !e.ref?.strictDate);
    
    const applied: any[] = [];
    
    for (const e of incomes) {
        applied.push({ ...e, date: d });
        balance += e.amt;
    }
    for (const e of strictOut) {
        applied.push({ ...e, date: d });
        balance += e.amt;
    }
    
    // Add today's flexible expenses to the pending backlog
    delayedItems.push(...flexibleOut);
    
    const hasIncomeToday = incomes.length > 0 || d === startDate;
    
    // 2. Process Flexible Expenses ONLY on Income Days (or Start Date)
    if (hasIncomeToday) {
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
          if (balance + e.amt >= targetMin) {
             if (e.originalDate > d) {
                 e.pulledEarly = true;
             } else if (e.originalDate < d) {
                 e.isDelayed = true;
             }
             e.optimizedFrom = e.originalDate;
             applied.push({ ...e, date: d });
             balance += e.amt;
          } else {
             // If we can't pay it, it waits. Only mark it delayed if its original date has passed or is today.
             if (e.originalDate <= d) {
                 e.isDelayed = true;
                 e.optimizedFrom = e.originalDate;
                 newDelayed.push(e);
             }
             // If it's in the future, we just leave it alone so it gets processed naturally.
          }
       }
       delayedItems = newDelayed;
    }
    
    // Finalize applied events"""

content = pattern.sub(replacement, content)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)
