const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
  'for (const d of datesBetween(startD, endD)) {',
  'let lastRescuePeriodEnd: string | null = null;\n  for (const d of datesBetween(startD, endD)) {'
);

const lookaheadCode = `
    // Period Lookahead for Savings Rescue
    const nextIncomeObj = futureEvents.find(e => (e?.targetDate || e?.originalDate) > d && (e?.amt || 0) > 0 && e?.type === 'income');
    const nextIncomeDate = nextIncomeObj ? (nextIncomeObj?.targetDate || nextIncomeObj?.originalDate) : '9999-12-31';

    if (lastRescuePeriodEnd !== nextIncomeDate) {
        let simBalance = balance;
        let minSimBalance = simBalance;
        let simSavings = savingsAccumulated;

        // Apply backlog (immediate debt)
        for (const e of delayedItems) {
            simBalance += (e.amt || 0);
        }
        if (simBalance < minSimBalance) minSimBalance = simBalance;

        // Simulate days up to the next income (exclusive)
        let simDates = datesBetween(d, nextIncomeDate === '9999-12-31' ? endD : nextIncomeDate);
        if (nextIncomeDate !== '9999-12-31') {
           simDates = simDates.filter(sd => sd < nextIncomeDate);
        }

        for (const wd of simDates) {
            const wEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === wd && !e?.pulledEarly);
            const wIncomes = wEvents.filter(e => (e?.amt || 0) >= 0);
            const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && !(e?.type === 'savings' && wd < todayStr()));

            for (const e of wIncomes) simBalance += (e.amt || 0);
            for (const e of wOut) {
                simBalance += (e.amt || 0);
                if (e.type === 'savings') simSavings += Math.abs(e.amt || 0);
            }
            if (simBalance < minSimBalance) minSimBalance = simBalance;
        }

        if (minSimBalance < targetMin && savingsAccumulated > 0) {
            const deficit = targetMin - minSimBalance;
            const amtToWithdraw = Math.min(deficit, savingsAccumulated);

            if (amtToWithdraw > 0) {
                const autowithdrawKey = \`rescate_ahorros_autowithdraw_\${d}\`;
                const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
                if (!isDiscarded) {
                    // Inject a single rescue transaction for this entire period
                    applied.push({
                        date: d,
                        label: 'Rescate de Ahorros',
                        type: 'rescate_ahorros',
                        amt: amtToWithdraw,
                        ref: { id: \`autowithdraw_\${d}\`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
                        originalDate: d,
                        done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
                        runningBalance: balance, // Will be updated by applyEvent logic
                        isDelayed: false,
                        insufficientFunds: false,
                        savingsAccumulated,
                    });
                }
            }
        }
        lastRescuePeriodEnd = nextIncomeDate;
    }

`;

txt = txt.replace(
  'const applied: any[] = [];',
  'const applied: any[] = [];\n' + lookaheadCode
);

fs.writeFileSync(p, txt);
