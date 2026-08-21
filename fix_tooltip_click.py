import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """        <button 
          onClick={(e) => { e.stopPropagation(); setPeriodDetails(data); }}
          className="w-full mt-2 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
        >
          Ver Detalle Completo
        </button>"""

replacement = """        <p className="text-[10px] text-slate-500 mt-3 text-center font-bold bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">👆 Haz clic en la gráfica para ver detalles</p>"""

content = content.replace(target, replacement)

# We also need to make sure the tooltip pointerEvents is 'none' so it doesn't block the click to the chart.
content = content.replace("wrapperStyle={{ pointerEvents: 'auto' }}", "wrapperStyle={{ pointerEvents: 'none' }}")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
