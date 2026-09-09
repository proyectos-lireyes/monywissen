const fs = require('fs');
const p = 'src/components/calendar/CalendarView.tsx';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(/const ghostEvents = plan\.filter.*?isGhost: true \}\)\);.*isGhost: true \}\)\);/s, "const ghostEvents = plan.filter(e => e.originalDate === dateStr && e.date !== dateStr && !e.done && filterOccurrence(e)).map(e => ({ ...e, isGhost: true }));");
fs.writeFileSync(p, txt);
