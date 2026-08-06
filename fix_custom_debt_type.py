import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

search = """export interface CustomDebtType {
  id: string;
  name: string;
  freq: FrequencyType;
  hasInterest: boolean;
  usePlan: boolean;
  color: string;
}"""

replace = """export interface CustomDebtType {
  id: string;
  name: string;
  freq: FrequencyType;
  dueDay?: string;
  hasInterest: boolean;
  usePlan: boolean;
  color: string;
}"""

content = content.replace(search, replace)

with open('src/types/index.ts', 'w') as f:
    f.write(content)
