import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# Replace these objects using regex or simple replace
replacements = [
    ("freq: 'monthly', hasInterest: true, usePlan: false, color: '#1a73e8'", "freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: false, color: '#1a73e8'"),
    ("freq: 'monthly', hasInterest: true, usePlan: true, color: '#d93025'", "freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: true, color: '#d93025'"),
    ("freq: 'biweekly', hasInterest: false, usePlan: true, color: '#fbbc04'", "freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: true, color: '#fbbc04'"),
    ("freq: 'monthly', hasInterest: true, usePlan: true, color: '#0f9d58'", "freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: true, color: '#0f9d58'"),
    ("freq: 'biweekly', hasInterest: false, usePlan: true, color: '#e65100'", "freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: true, color: '#e65100'"),
    ("freq: 'weekly', hasInterest: true, usePlan: false, color: '#9c27b0'", "freq: 'weekly', dueDay: '1', hasInterest: true, usePlan: false, color: '#9c27b0'"),
    ("freq: 'biweekly', hasInterest: false, usePlan: false, color: '#00acc1'", "freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: false, color: '#00acc1'"),
    ("freq: 'monthly', hasInterest: false, usePlan: true, color: '#e91e63'", "freq: 'monthly', dueDay: '1', hasInterest: false, usePlan: true, color: '#e91e63'"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
