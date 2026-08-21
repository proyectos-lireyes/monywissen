import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add items and balance to netFlowMonthlyData
content = content.replace("expense: m.expense + m.debt,", "expense: m.expense + m.debt,\n      items: m.items,\n      balance: m.balance,\n      savingsAccumulated: m.savingsAccumulated,")

# Add onClick to chartMode === 3 ComposedChart
content = content.replace("<ComposedChart data={netFlowMonthlyData}>", "<ComposedChart data={netFlowMonthlyData} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
