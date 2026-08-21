import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

def get_lines(dot_str="true"):
    return f"""                  <Line hide={{hiddenLines["income"]}} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["savingsAccumulated"]}} type="monotone" dataKey="savingsAccumulated" yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["debt"]}} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["expense"]}} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["totalEgresos"]}} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["netAvailable"]}} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />
                  <Line hide={{hiddenLines["balance"]}} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={{2}} dot={{{dot_str}}} activeDot={{onClick: (e: any, payload: any) => {{ e.stopPropagation(); setPeriodDetails(payload.payload); }}, cursor: 'pointer'}} />"""

# We need to replace the <Line> definitions inside chartMode === 3 (Biweekly), 4 (Weekly), 1 (Monthly).
# We also have chartMode 0 (Daily).

# Because the file has multiple instances of these blocks, it might be easier to use regex.
# Let's see how many `                  <Line hide={` instances we have.
