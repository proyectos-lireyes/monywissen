import fs from 'fs';

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const target = `    let baseExpectedAmount = i < inst ? scheduleAmounts[i] : 0;
    if (isCard && i >= inst) baseExpectedAmount = 0; // fallback just in case
    if (baseExpectedAmount === 0 && i < inst && !isCard) baseExpectedAmount = pay; // fallback for one-time or 0 `;

const replacement = `    let baseExpectedAmount = i < inst ? scheduleAmounts[i] : pay;
    if (isCard && i >= inst) baseExpectedAmount = 0; // fallback just in case
    if (baseExpectedAmount === 0 && !isCard) baseExpectedAmount = pay; // fallback for one-time or 0`;

content = content.replace(target, replacement);

fs.writeFileSync('src/utils/financialEngine.ts', content);
