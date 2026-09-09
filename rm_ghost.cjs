const fs = require('fs');
const p = 'src/components/calendar/CalendarView.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/const ghostEvents = plan\.filter.*?isGhost: true \}\)\);/, "const ghostEvents: any[] = [];");

fs.writeFileSync(p, txt);
