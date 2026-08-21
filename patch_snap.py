import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

snap_function = """export function snapDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  const d = curr.getDate();
  const m = curr.getMonth();

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
  } else if (freq === 'weekly') {
    if (dueDay !== undefined) {
      const targetDay = parseInt(String(dueDay), 10);
      if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
        const currentDay = curr.getDay();
        if (currentDay !== targetDay) {
          let diff = targetDay - currentDay;
          if (diff < 0) diff += 7;
          curr.setDate(curr.getDate() + diff);
        }
      }
    }
  } else if (freq === 'triweekly') {
    const week = parseInt(String(dueDay || '1'), 10);
    const targetDay = week * 7;
    if (d < targetDay) {
        curr.setDate(targetDay);
    } else if (d > targetDay) {
        curr.setMonth(m + 1, targetDay);
    }
  }
}

export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {"""

if "export function snapDateFreq" not in content:
    content = content.replace("export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {", snap_function)

target_loop = """  let curr = new Date((debt.start || todayStr()) + 'T12:00:00');
  
  if (amort > 0 && freq !== 'one-time') {
    advanceDateFreq(curr, freq, dueDay);
  }"""

replacement_loop = """  let curr = new Date((debt.start || todayStr()) + 'T12:00:00');
  
  if (freq !== 'one-time') {
    if (amort > 0) {
        // If some is already amortized, advance cycle to skip past it
        snapDateFreq(curr, freq, dueDay); // first snap to valid date
        advanceDateFreq(curr, freq, dueDay); // then advance to next cycle
    } else {
        // Just snap to the nearest valid due date
        snapDateFreq(curr, freq, dueDay);
    }
  }"""

if target_loop in content:
    content = content.replace(target_loop, replacement_loop)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Success patch")
else:
    print("Target loop not found")

