import fs from 'fs';

let content = fs.readFileSync('src/types/index.ts', 'utf8');

// Undo the double replacement
content = content.replace(/date\?: string;\n  receiptImg\?: string;/g, 'date?: string;');

// Now safely add receiptImg to IncomeItem and ExpenseItem
content = content.replace(
  'export interface IncomeItem {\n  id: string;\n  name: string;\n  amount: number;\n  freq: FrequencyType;\n  day?: number | string; // Day number or biweekly pair \'15-30\'\n  date?: string; // For \'one-time\'',
  'export interface IncomeItem {\n  id: string;\n  name: string;\n  amount: number;\n  freq: FrequencyType;\n  day?: number | string; // Day number or biweekly pair \'15-30\'\n  date?: string; // For \'one-time\'\n  receiptImg?: string;'
);

content = content.replace(
  'export interface ExpenseItem {\n  id: string;\n  name: string;\n  amount: number;\n  freq: FrequencyType;\n  day?: number | string;\n  date?: string;',
  'export interface ExpenseItem {\n  id: string;\n  name: string;\n  amount: number;\n  freq: FrequencyType;\n  day?: number | string;\n  date?: string;\n  receiptImg?: string;'
);

fs.writeFileSync('src/types/index.ts', content);
