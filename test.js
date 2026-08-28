function advanceDateFreq(curr, freq, dueDay) {
  if (freq === 'weekly') {
    curr.setDate(curr.getDate() + 7);
    if (dueDay !== undefined) {
      const targetDay = parseInt(String(dueDay), 10);
      if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
        const currentDay = curr.getDay();
        const diff = targetDay - currentDay;
        curr.setDate(curr.getDate() + diff);
      }
    }
  } else if (freq === 'biweekly') {
    const parts = String(dueDay || '15-30').split('-');
    const v1 = parseInt(parts[0], 10) || 15;
    const v2 = parts[1] || '30';
    const d = curr.getDate();
    const m = curr.getMonth();
    const limitV2 = (v2 === '30' || v2 === 'EOM') ? 28 : parseInt(v2, 10);

    if (d < v1) {
      curr.setDate(v1);
    } else if (d >= v1 && d < limitV2) {
      if (v2 === '30' || v2 === 'EOM') {
        curr.setMonth(m + 1, 0);
      } else {
        curr.setDate(parseInt(v2, 10));
      }
    } else {
      curr.setDate(1);
      curr.setMonth(m + 1);
      curr.setDate(v1);
    }
  } else if (freq === 'triweekly') {
    const week = parseInt(String(dueDay || '1'), 10);
    const targetDay = week * 7;
    const m = curr.getMonth();
    curr.setMonth(m + 1, targetDay);
    if (curr.getMonth() !== (m + 1) % 12) {
      curr.setDate(0);
    }
  } else {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 1);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  }
}

let curr = new Date('2026-09-15T12:00:00');
console.log(curr.toISOString());
for(let i=0; i<5; i++) {
  advanceDateFreq(curr, 'biweekly', '15-30');
  console.log(curr.toISOString());
}
