const applied = [
  { type: 'income', amt: 100, runningBalance: 100 },
  { type: 'debt', amt: -120, runningBalance: -20 },
  { type: 'rescate_ahorros', amt: 20, runningBalance: 0 },
  { type: 'debt', amt: -30, runningBalance: -30 },
  { type: 'rescate_ahorros', amt: 30, runningBalance: 0 },
  { type: 'income', amt: 50, runningBalance: 50 },
  { type: 'debt', amt: -60, runningBalance: -10 },
  { type: 'rescate_ahorros', amt: 10, runningBalance: 0 }
];

let currentRescueIdx = -1;
for (let i = 0; i < applied.length; i++) {
  const ev = applied[i];
  if (ev.type === 'income' && ev.amt > 0) {
    currentRescueIdx = -1; // Reset group on income
  } else if (ev.type === 'rescate_ahorros') {
    if (currentRescueIdx === -1) {
      currentRescueIdx = i; // Start a new group
    } else {
      // Consolidate into the first rescue of the group
      applied[currentRescueIdx].amt += ev.amt;
      // Mark this one for deletion
      ev.isDeleted = true;
    }
  }
}

// Remove deleted
const newApplied = applied.filter(e => !e.isDeleted);

// Recalculate runningBalance
let bal = 0; // Or whatever initial balance
for (let i = 0; i < newApplied.length; i++) {
  bal += newApplied[i].amt;
  newApplied[i].runningBalance = bal;
}

console.log(newApplied);
