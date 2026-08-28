import fs from 'fs';
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// 1. Auto-saving skip if past and undone
code = code.replace(
  /const isDiscarded = overrides\[autosaveKey\] && overrides\[autosaveKey\]\.discarded;\s+if \(\!isDiscarded\) \{/,
  `const isDiscarded = overrides[autosaveKey] && overrides[autosaveKey].discarded;
       const isDone = overrides[autosaveKey] ? !!overrides[autosaveKey].done : false;
       
       if (!isDiscarded && !(d < todayStr() && !isDone)) {`
);

// 2. Strict out logic - remove savings from strictDate if undone
code = code.replace(
  /let strictOut = dayEvents\.filter\(e => e\.amt < 0 && \(e\.done \|\| e\.ref\?\.strictDate\)\);/,
  `let strictOut = dayEvents.filter(e => e.amt < 0 && (e.done || (e.ref?.strictDate && e.type !== 'savings')));`
);
code = code.replace(
  /let flexibleOut = dayEvents\.filter\(e => e\.amt < 0 && \!e\.done && \!e\.ref\?\.strictDate\);/,
  `let flexibleOut = dayEvents.filter(e => e.amt < 0 && !e.done && !(e.ref?.strictDate && e.type !== 'savings'));`
);

// 3. For flexibleOut in the past, if type === 'savings', force it to delay?
// Or better: just delay it before even trying to execute it!
// Let's look at where flexibleOut executes:
