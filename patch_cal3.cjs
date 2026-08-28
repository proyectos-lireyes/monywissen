const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

code = code.replace(
  /const nextMonthEndStr = `.*?`;\s*const filteredPlan = plan\s*\.filter\(e => searchQuery \? true : \(e\.date <= nextMonthEndStr\)\)/,
  `const nextMonthEndStr = '';\n              const filteredPlan = plan\n                .filter(e => searchQuery ? true : e.date.startsWith(prefixMonth))`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
