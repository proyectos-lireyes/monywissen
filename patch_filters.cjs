const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

code = code.replace(
  `    if (activeOutflowFilters.length > 0) {
      if (e.amt > 0 && e.type === 'income') return false;
      const typeToMatch = e.type === 'expense' ? 'expense' : (e.type === 'savings' ? 'savings' : (e.ref?.type || e.type));
      if (!activeOutflowFilters.includes(typeToMatch)) return false;
    }`,
  `    if (activeOutflowFilters.length > 0) {
      if (!activeOutflowFilters.includes(e.type)) return false;
    }`
);

code = code.replace(
  `      {/* Filter Chips Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Filtros por Estado
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'pending', label: '🔴 Pendientes' },
            { id: 'overdue', label: '⚠️ Atrasados' },
            { id: 'postponed', label: '🔄 Pospuestos' },
            { id: 'pulledEarly', label: '⚡ Adelantados' },
            { id: 'deficit', label: '🚨 Quiebre' },
          ].map(f => {
            const isActive = activeStateFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleStateFilter(f.id)}
                className={\`px-3 py-1.5 rounded-full text-xs font-semibold transition-all \${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }\`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>`,
  `      {/* Filter Chips Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Filtros por Estado y Tipo
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'pending', label: '🔴 Pendientes', type: 'state' },
            { id: 'overdue', label: '⚠️ Atrasados', type: 'state' },
            { id: 'postponed', label: '🔄 Pospuestos', type: 'state' },
            { id: 'pulledEarly', label: '⚡ Adelantados', type: 'state' },
            { id: 'deficit', label: '🚨 Quiebre', type: 'state' },
            { id: 'expense', label: '📉 Gastos', type: 'outflow' },
            { id: 'debt', label: '💳 Deudas', type: 'outflow' },
          ].map(f => {
            const isActive = f.type === 'state' ? activeStateFilters.includes(f.id) : activeOutflowFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => f.type === 'state' ? toggleStateFilter(f.id) : toggleOutflowFilter(f.id)}
                className={\`px-3 py-1.5 rounded-full text-xs font-semibold transition-all \${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }\`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
console.log("Patched CalendarView filters");
