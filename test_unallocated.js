const overrides = {
  'debt_1_2026-07-18': { done: true, amt: 26.36 },
  'debt_1_2026-07-25': { done: true, amt: 25 },
  'debt_1_2026-08-01': { done: true, amt: 30 },
  'debt_1_2026-08-21': { partials: [{ amt: 20 }] }
};

let unallocated = 0;
// assume dates = ['2026-07-18', '2026-07-25', '2026-08-01', '2026-08-22']
const expectedDates = new Set(['2026-07-18', '2026-07-25', '2026-08-01', '2026-08-22']);
Object.keys(overrides).forEach(k => {
  if (k.startsWith('debt_1_')) {
    const dateStr = k.split('_')[2];
    if (!expectedDates.has(dateStr)) {
      console.log('Found off-schedule payment on', dateStr);
      // sum it to unallocated
    }
  }
});
