const fs = require('fs');
eval(fs.readFileSync('test.js', 'utf8').split('let curr')[0]);
let curr = new Date('2026-09-15T12:00:00');
console.log(curr.toISOString());
for(let i=0; i<5; i++) {
  advanceDateFreq(curr, 'monthly', '15');
  console.log(curr.toISOString());
}
