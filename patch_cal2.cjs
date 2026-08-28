const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

// 1. Move month navigation above the summary cards
const summaryCardsStart = `{/* Monthly Summary Cards */}`;
const monthNav = `
        <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setCurrentCalDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 capitalize">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => setCurrentCalDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
`;
code = code.replace(summaryCardsStart, monthNav + '\n        ' + summaryCardsStart);

// 2. Remove the old month nav from inside the calendar view
code = code.replace(
  /<div className="flex items-center justify-between">\n\s*<button\n\s*onClick=\{\(\) => setCurrentCalDate\(new Date\(year, month - 1, 1\)\)\}\n\s*className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"\n\s*>\n\s*<ChevronLeft className="w-4 h-4" \/>\n\s*<\/button>\n\s*<h3 className="text-sm font-black text-slate-900 dark:text-slate-100">\n\s*\{monthNames\[month\]\} \{year\}\n\s*<\/h3>\n\s*<button\n\s*onClick=\{\(\) => setCurrentCalDate\(new Date\(year, month \+ 1, 1\)\)\}\n\s*className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"\n\s*>\n\s*<ChevronRight className="w-4 h-4" \/>\n\s*<\/button>\n\s*<\/div>/,
  `{/* Month navigation moved above */}`
);

// 3. Change List mode to filter by current month
code = code.replace(
  /\/\/ Calculate end of next month\n\s*const nextMonthEnd = new Date\(year, month \+ 2, 0\);\n\s*const nextMonthEndStr = `\$\{nextMonthEnd\.getFullYear\(\)\}-\{\(nextMonthEnd\.getMonth\(\) \+ 1\)\.toString\(\)\.padStart\(2, '0'\)\}-\$\{nextMonthEnd\.getDate\(\)\.toString\(\)\.padStart\(2, '0'\)\}`;\n\s*const filteredPlan = plan\n\s*\.filter\(e => searchQuery \? true : \(e\.date <= nextMonthEndStr\)\)/,
  `const filteredPlan = plan\n                .filter(e => searchQuery ? true : e.date.startsWith(prefixMonth))`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
