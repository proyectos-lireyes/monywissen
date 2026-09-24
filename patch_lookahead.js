import fs from 'fs';
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const target = `    if (lastRescuePeriodEnd !== nextIncomeDate || hasIncomeToday) {
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
            const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !(e?.type === 'savings' && wd < todayStr()));

            for (const e of wIncomes) simBalance += (e.amt || 0);
            for (const e of wOut) {
                simBalance += (e.amt || 0);
                if (e.type === 'savings') simSavings += Math.abs(e.amt || 0);
            }
            if (simBalance < minSimBalance) minSimBalance = simBalance;
        }

        // 1. SMART AUTO-SAVE (Pre-ingreso):
        // Si hoy hay un ingreso, calculamos el exceso real sobrante del ciclo anterior.
        // Pero NO guardamos más de lo que nos permite el minSimBalance del NUEVO ciclo.
        if (hasIncomeToday && d !== startD) {
            const pendingDelayed = delayedItems.reduce((acc, item) => acc + ((item?.amt || 0) < 0 ? item.amt : 0), 0);
            const todayPending = flexibleOut.reduce((acc, item) => acc + (item?.amt || 0), 0);
            
            let rawExcess = balance - targetMin + pendingDelayed + todayPending;
            if (rawExcess < 0) rawExcess = 0;
            
            // El exceso que verdaderamente sobra para TODO el próximo ciclo (incluyendo este ingreso)
            const periodExcess = minSimBalance - targetMin;
            let safeExcess = 0;
            if (periodExcess > 0 && rawExcess > 0) {
                safeExcess = Math.min(rawExcess, periodExcess);
            }

            if (safeExcess > 0) {
                const autosaveKey = \`savings_autosave_\${d}_\${d}\`;
                const missedKey = \`expense_missed_autosave_\${d}_\${d}\`;
                const isDiscarded = (overrides[autosaveKey] && overrides[autosaveKey].discarded) || (overrides[missedKey] && overrides[missedKey].discarded);
                const isDone = (overrides[autosaveKey] && overrides[autosaveKey].done) || (overrides[missedKey] && overrides[missedKey].done);
                
                if (!isDiscarded) {
                    if (d < todayStr() && !isDone) {
                        balance -= safeExcess;
                        plan.push({
                            date: d,
                            label: 'Ajuste: Excedente gastado (No ahorrado)',
                            type: 'expense',
                            amt: -safeExcess,
                            ref: { id: \`missed_autosave_\${d}\`, name: 'Ajuste de Saldo', effectiveColor: '#f59e0b' },
                            originalDate: d,
                            done: true,
                            balance,
                            isDelayed: false,
                            savingsAccumulated,
                        });
                    } else {
                        balance -= safeExcess;
                        savingsAccumulated += safeExcess;
                        plan.push({
                            date: d,
                            label: 'Ahorro Automático (Excedente pre-ingreso)',
                            type: 'savings',
                            amt: -safeExcess,
                            ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                            originalDate: d,
                            done: !!isDone,
                            balance,
                            isDelayed: false,
                            savingsAccumulated,
                        });
                    }
                }
                
                minSimBalance -= safeExcess; // Descontar lo ahorrado de la simulación
            }
        }

        // 2. SAVINGS RESCUE
        if (minSimBalance < targetMin && savingsAccumulated > 0 && lastRescuePeriodEnd !== nextIncomeDate) {
            const deficit = targetMin - minSimBalance;
            const amtToWithdraw = Math.min(deficit, savingsAccumulated);`;


const replacement = `    if (lastRescuePeriodEnd !== nextIncomeDate || hasIncomeToday) {
        let simBalance = balance;
        let minSimBalanceAllFuture = simBalance;
        let minSimBalanceCurrentPeriod = simBalance;

        // Apply backlog (immediate debt)
        for (const e of delayedItems) {
            simBalance += (e.amt || 0);
        }
        if (simBalance < minSimBalanceAllFuture) minSimBalanceAllFuture = simBalance;
        if (simBalance < minSimBalanceCurrentPeriod) minSimBalanceCurrentPeriod = simBalance;

        // Simulate days up to the END OF THE PLAN to find the absolute minimum balance
        let simDatesAll = datesBetween(d, endD);

        for (const wd of simDatesAll) {
            const wEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === wd && !e?.pulledEarly);
            const wIncomes = wEvents.filter(e => (e?.amt || 0) >= 0);
            const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !(e?.type === 'savings' && wd < todayStr()));

            for (const e of wIncomes) simBalance += (e.amt || 0);
            for (const e of wOut) {
                simBalance += (e.amt || 0);
            }
            
            if (simBalance < minSimBalanceAllFuture) {
                minSimBalanceAllFuture = simBalance;
            }
            if (wd < nextIncomeDate) {
                if (simBalance < minSimBalanceCurrentPeriod) {
                    minSimBalanceCurrentPeriod = simBalance;
                }
            }
        }

        // 1. SMART AUTO-SAVE (Pre-ingreso):
        // Si hoy hay un ingreso, calculamos el exceso real sobrante.
        // Pero NO guardamos más de lo que nos permite el minSimBalanceAllFuture (para NUNCA quedar en negativo en el futuro).
        if (hasIncomeToday && d !== startD) {
            const pendingDelayed = delayedItems.reduce((acc, item) => acc + ((item?.amt || 0) < 0 ? item.amt : 0), 0);
            const todayPending = flexibleOut.reduce((acc, item) => acc + (item?.amt || 0), 0);
            
            let rawExcess = balance - targetMin + pendingDelayed + todayPending;
            if (rawExcess < 0) rawExcess = 0;
            
            // El exceso que verdaderamente sobra para TODO EL PLAN PROYECTADO
            const periodExcess = minSimBalanceAllFuture - targetMin;
            let safeExcess = 0;
            if (periodExcess > 0 && rawExcess > 0) {
                safeExcess = Math.min(rawExcess, periodExcess);
            }

            if (safeExcess > 0) {
                const autosaveKey = \`savings_autosave_\${d}_\${d}\`;
                const missedKey = \`expense_missed_autosave_\${d}_\${d}\`;
                const isDiscarded = (overrides[autosaveKey] && overrides[autosaveKey].discarded) || (overrides[missedKey] && overrides[missedKey].discarded);
                const isDone = (overrides[autosaveKey] && overrides[autosaveKey].done) || (overrides[missedKey] && overrides[missedKey].done);
                
                if (!isDiscarded) {
                    if (d < todayStr() && !isDone) {
                        balance -= safeExcess;
                        plan.push({
                            date: d,
                            label: 'Ajuste: Excedente gastado (No ahorrado)',
                            type: 'expense',
                            amt: -safeExcess,
                            ref: { id: \`missed_autosave_\${d}\`, name: 'Ajuste de Saldo', effectiveColor: '#f59e0b' },
                            originalDate: d,
                            done: true,
                            balance,
                            isDelayed: false,
                            savingsAccumulated,
                        });
                    } else {
                        balance -= safeExcess;
                        savingsAccumulated += safeExcess;
                        plan.push({
                            date: d,
                            label: 'Ahorro Automático (Excedente pre-ingreso)',
                            type: 'savings',
                            amt: -safeExcess,
                            ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                            originalDate: d,
                            done: !!isDone,
                            balance,
                            isDelayed: false,
                            savingsAccumulated,
                        });
                    }
                }
                
                minSimBalanceCurrentPeriod -= safeExcess; // Descontar lo ahorrado de la simulación del periodo actual
            }
        }

        // 2. SAVINGS RESCUE
        // Rescatamos dinero SOLO si el periodo actual (antes del siguiente ingreso) proyecta estar en negativo
        if (minSimBalanceCurrentPeriod < targetMin && savingsAccumulated > 0 && lastRescuePeriodEnd !== nextIncomeDate) {
            const deficit = targetMin - minSimBalanceCurrentPeriod;
            const amtToWithdraw = Math.min(deficit, savingsAccumulated);`;

if (code.includes('if (lastRescuePeriodEnd !== nextIncomeDate || hasIncomeToday) {') && code.includes('const amtToWithdraw = Math.min(deficit, savingsAccumulated);')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/utils/financialEngine.ts', code);
    console.log("Patched correctly");
} else {
    console.log("Could not find the target");
}

