import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Define the new blocks of lines
lines_with_dot = """                  <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["savingsAccumulated"]} type="monotone" dataKey="savingsAccumulated" yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />"""

lines_without_dot = """                  <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["savingsAccumulated"]} type="monotone" dataKey="savingsAccumulated" yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                  <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />"""


# Function to replace all <Line hide=...> blocks
def replace_blocks(content):
    # Regex to find blocks of <Line hide={hiddenLines...
    pattern_with_dot = re.compile(r'(\s*<Line hide=\{hiddenLines\["income"\]\}[^>]*?dot=\{true\}.*?</ComposedChart>)', re.DOTALL)
    
    # Actually, it's easier to find the starting line and ending line
    # Let's split content into lines and replace the sections
    
    out_lines = []
    in_block = False
    block_type = None
    
    c_lines = content.split('\n')
    i = 0
    while i < len(c_lines):
        line = c_lines[i]
        
        if '<Line hide={hiddenLines["income"]}' in line:
            if 'dot={true}' in line:
                out_lines.append(lines_with_dot)
                # Skip all <Line hide=... lines
                while i < len(c_lines) and '<Line hide={hiddenLines' in c_lines[i]:
                    i += 1
                continue
            elif 'dot={false}' in line:
                out_lines.append(lines_without_dot)
                while i < len(c_lines) and '<Line hide={hiddenLines' in c_lines[i]:
                    i += 1
                continue
        
        if '{showFlowLines && (' in line and 'yAxisId="left"' in c_lines[i+2]:
            # This is the daily chart old style where showFlowLines wraps the lines
            # But the user might want hide={hiddenLines} universally now?
            # Let's just remove showFlowLines block entirely and use the standard one.
            pass
            
        out_lines.append(line)
        i += 1
        
    return '\n'.join(out_lines)

# Apply simple replacement for the 3 blocks we know
# Wait, let's just use re.sub for the exact text since there are exactly 3 of them.
block_to_find = """                  <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["savingsAccumulated"]} type="monotone" dataKey="savingsAccumulated" yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />"""

if block_to_find in content:
    content = content.replace(block_to_find, lines_with_dot)
    print("Replaced all dot={true} blocks successfully.")
else:
    print("Could not find the exact dot={true} block.")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

