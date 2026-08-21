function snapDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  const d = curr.getDate();
  const m = curr.getMonth();
  const y = curr.getFullYear();

  if (freq === 'monthly') {
    const targetDay = parseInt(String(dueDay || '1'), 10);
    if (d < targetDay) {
      curr.setDate(targetDay);
    } else if (d > targetDay) {
      curr.setMonth(m + 1, targetDay);
    }
  } else if (freq === 'biweekly') {
    const parts = String(dueDay || '15-30').split('-');
    const v1 = parseInt(parts[0], 10) || 15;
    const v2 = parts[1] || '30';
    
    // Determine the actual date for v2 in the current month
    let v2Date = 30;
    const temp = new Date(curr.getTime());
    if (v2 === '30' || v2 === 'EOM') {
        temp.setMonth(m + 1, 0);
        v2Date = temp.getDate();
    } else {
        v2Date = parseInt(v2, 10);
    }

    if (d < v1) {
        curr.setDate(v1);
    } else if (d > v1 && d < v2Date) {
        if (v2 === '30' || v2 === 'EOM') {
            curr.setMonth(m + 1, 0);
        } else {
            curr.setDate(v2Date);
        }
    } else if (d > v2Date) {
        curr.setDate(1);
        curr.setMonth(m + 1);
        curr.setDate(v1);
    }
    // If d === v1 or d === v2Date, it's already exactly on a payment day, do nothing.
  }
}

const dates = [
    new Date('2026-08-19T12:00:00'),
    new Date('2026-08-20T12:00:00'),
    new Date('2026-08-27T12:00:00'),
    new Date('2026-08-31T12:00:00'),
    new Date('2026-09-05T12:00:00'),
];

dates.forEach(d => {
    const orig = new Date(d.getTime());
    snapDateFreq(d, 'biweekly', '20-30');
    console.log(`${orig.toISOString().slice(0,10)} -> ${d.toISOString().slice(0,10)}`);
});
