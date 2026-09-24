import fs from 'fs';

let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

// Patch 1 (Main list)
const target1 = `<span className="truncate">{e.label}</span> {e.isGhost && <span className="text-[9px] font-normal no-underline ml-1 shrink-0">(Plan original)</span>}`;
const replacement1 = `<span className="truncate">{e.label}</span> {e.isGhost && <span className="text-[9px] font-normal no-underline ml-1 shrink-0 text-slate-500">(Plan original)</span>}
                          {!e.isGhost && e.originalDate && e.originalDate !== e.date && (
                             <span className="text-[9px] font-normal no-underline ml-1 shrink-0 text-slate-500">
                               (Plan: {formatDateStr(e.originalDate).substring(0,5)})
                             </span>
                          )}`;

// Patch 2 (Selected day details)
const target2 = `{e.label}
                        {e.pulledEarly && !e.done && <span title="Adelantado automáticamente" className="text-emerald-500 no-underline">⚡</span>}`;
const replacement2 = `{e.label}
                        {!e.isGhost && e.originalDate && e.originalDate !== e.date && (
                             <span className="text-[9px] font-normal no-underline ml-1 shrink-0 opacity-70">
                               (Plan: {formatDateStr(e.originalDate).substring(0,5)})
                             </span>
                        )}
                        {e.pulledEarly && !e.done && <span title="Adelantado automáticamente" className="text-emerald-500 no-underline">⚡</span>}`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
console.log("Patched CalendarView");
