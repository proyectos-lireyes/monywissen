const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');

// 1. Remove old rescue logic inside applyEvent
const oldRescueLogicRegex = /let rescuedAmt = 0;\s*if\s*\(balance < targetMin && savingsAccumulated > 0\)\s*\{[\s\S]*?\}\s*applied\[eventIndex\]\.runningBalance = balance - \(typeof rescuedAmt !== 'undefined' \? rescuedAmt : 0\);/g;
txt = txt.replace(oldRescueLogicRegex, 'applied[eventIndex].runningBalance = balance;');

fs.writeFileSync(p, txt);
