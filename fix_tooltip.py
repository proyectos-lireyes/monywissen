import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """        <p className="text-[9px] text-slate-400 mt-2 text-center italic">Clic en los puntos para ver el detalle</p>"""

replacement = """        <button 
          onClick={(e) => { e.stopPropagation(); setPeriodDetails(data); }}
          className="w-full mt-2 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
        >
          Ver Detalle Completo
        </button>"""

content = content.replace(target, replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
