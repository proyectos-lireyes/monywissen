import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
// Making sure debounce time is applied
console.log(content.includes('5000)'));
