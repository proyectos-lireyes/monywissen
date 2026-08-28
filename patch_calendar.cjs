const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

// Disable click for opening_balance
code = code.replace(
  `onClick={(e) => {
                          e.stopPropagation();
                          if (!ev.isGhost) {
                             onOpenDetails(ev.type, ev.ref.id, ev.originalDate, ev.date);
                          }
                        }}`,
  `onClick={(e) => {
                          e.stopPropagation();
                          if (!ev.isGhost && ev.type !== 'opening_balance') {
                             onOpenDetails(ev.type, ev.ref.id, ev.originalDate, ev.date);
                          }
                        }}`
);

code = code.replace(
  `onClick={() => { if (!e.isGhost) onOpenDetails(e.type, e.ref?.id || '', e.originalDate || e.date, e.date); }}`,
  `onClick={() => { if (!e.isGhost && e.type !== 'opening_balance') onOpenDetails(e.type, e.ref?.id || '', e.originalDate || e.date, e.date); }}`
);

// Disable hover/cursor style for opening_balance
code = code.replace(
  `const isGhost = e.isGhost;`,
  `const isGhost = e.isGhost;
   const isOpening = e.type === 'opening_balance';` // Wait, this might not exist.
);
code = code.replace(
  `className={\`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 \${!e.isGhost ? 'cursor-pointer' : 'cursor-help opacity-50'} \${`,
  `className={\`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 \${!e.isGhost && e.type !== 'opening_balance' ? 'cursor-pointer hover:opacity-80' : e.isGhost ? 'cursor-help opacity-50' : 'opacity-90'} \${`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
console.log("Patched calendar");
