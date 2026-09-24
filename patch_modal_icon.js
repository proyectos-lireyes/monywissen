import fs from 'fs';

let code = fs.readFileSync('src/components/modals/OccurrenceDetailModal.tsx', 'utf8');
code = code.replace(/<Calendar className="w-4 h-4" \/>/g, '<CalendarIcon className="w-4 h-4" />');
fs.writeFileSync('src/components/modals/OccurrenceDetailModal.tsx', code);
console.log("Fixed icon");
