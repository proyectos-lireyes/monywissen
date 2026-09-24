function calculateInstallments(lifetimeTotal, inst) {
  let scheduleAmounts = [];
  let sum = 0;
  for (let idx = 0; idx < inst; idx++) {
    if (idx === inst - 1) {
      let finalAmt = Math.round((lifetimeTotal - sum) * 100) / 100;
      scheduleAmounts.push(finalAmt);
    } else {
      let p = Math.round((lifetimeTotal / inst) * 100) / 100;
      scheduleAmounts.push(p);
      sum += p;
    }
  }
  return scheduleAmounts;
}
console.log(calculateInstallments(95, 3));
console.log(calculateInstallments(100, 3));
