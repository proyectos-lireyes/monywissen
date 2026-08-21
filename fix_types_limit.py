import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

target = """export interface CustomDebtType {
  id: string;
  name: string;
  freq: FrequencyType;
  dueDay?: string;
  cutDay?: number | string;
  creditLimit?: number | string;
  isCreditCard?: boolean;"""

replacement = """export interface CustomDebtType {
  id: string;
  name: string;
  freq: FrequencyType;
  dueDay?: string;
  cutDay?: number | string;
  creditLimit?: number | string;
  limitCurrency?: string;
  isCreditCard?: boolean;"""

content = content.replace(target, replacement)

with open('src/types/index.ts', 'w') as f:
    f.write(content)

print("Success")
