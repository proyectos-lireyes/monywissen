import fs from 'fs';

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const searchTarget = `    const ov = overrides[key] || {};
    
    let expectedAmount = pay;`;

const replaceTarget = `    const ov = overrides[key] || {};
    
    let baseExpectedAmount = i < inst ? scheduleAmounts[i] : 0;
    if (isCard && i >= inst) baseExpectedAmount = 0; // fallback just in case
    if (baseExpectedAmount === 0 && i < inst && !isCard) baseExpectedAmount = pay; // fallback for one-time or 0 

    let expectedAmount = baseExpectedAmount;`;

content = content.replace(searchTarget, replaceTarget);

content = content.replace(/Math\.max\(0, pay - partialsSum\)/g, 'Math.max(0, baseExpectedAmount - partialsSum)');
content = content.replace(/Math\.max\(pay, paidAmt\)/g, 'Math.max(baseExpectedAmount, paidAmt)');
content = content.replace(/Math\.min\(pay, unallocatedPaid\)/g, 'Math.min(baseExpectedAmount, unallocatedPaid)');
content = content.replace(/canCover >= pay - 0\.01/g, 'canCover >= baseExpectedAmount - 0.01');
content = content.replace(/paidAmt >= pay - 0\.01/g, 'paidAmt >= baseExpectedAmount - 0.01');
content = content.replace(/pay - paidAmt/g, 'baseExpectedAmount - paidAmt');

fs.writeFileSync('src/utils/financialEngine.ts', content);
