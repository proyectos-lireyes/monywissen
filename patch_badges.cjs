const fs = require('fs');
const file = './src/components/calendar/CalendarView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "{!e.done && e.date < today && (",
  "{!e.done && e.date < today && e.type !== 'rescate_ahorros' && !e.ref?.id?.startsWith('autosave') && !e.ref?.id?.startsWith('missed_autosave') && ("
);

code = code.replace(
  "{e.isDelayed && !e.insufficientFunds && !e.done && <span title=\"Retrasado\" className=\"text-amber-500 no-underline\">⚠️</span>}",
  "{e.isDelayed && !e.insufficientFunds && !e.done && e.type !== 'rescate_ahorros' && !e.ref?.id?.startsWith('autosave') && <span title=\"Retrasado\" className=\"text-amber-500 no-underline\">⚠️</span>}"
);

fs.writeFileSync(file, code);
