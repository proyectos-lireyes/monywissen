import fs from 'fs';

let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

// Patch 1 (Period Details)
const target1 = `<p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>`;
const replacement1 = `<p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                               {item.label}
                               {item.originalDate && item.originalDate !== item.date && (
                                   <span className="text-[10px] font-normal text-slate-500">(Plan: {formatDateStr(item.originalDate).substring(0,5)})</span>
                               )}
                            </p>`;

// Patch 2 (Upcoming List)
const target2 = `<p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {u.label}
                    </p>`;
const replacement2 = `<p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      {u.label}
                      {u.originalDate && u.originalDate !== u.date && (
                          <span className="text-[9px] font-normal text-slate-500">(Plan: {formatDateStr(u.originalDate).substring(0,5)})</span>
                      )}
                    </p>`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched DashboardView");
