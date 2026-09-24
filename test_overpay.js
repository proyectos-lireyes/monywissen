const inst = 3;
const lifetimeTotal = 95;

const scheduleAmounts = [];
let currentSum = 0;
for (let idx = 0; idx < inst; idx++) {
  if (idx === inst - 1) {
    scheduleAmounts.push(Math.round((lifetimeTotal - currentSum) * 100) / 100);
  } else {
    let p = Math.round((lifetimeTotal / inst) * 100) / 100;
    scheduleAmounts.push(p);
    currentSum += p;
  }
}

let pay = lifetimeTotal / inst;
let totalPaid = 95; // OVERPAYMENT OR FULL PAYMENT
let unallocatedPaid = totalPaid;
let remainingPrincipal = Math.max(0, lifetimeTotal - totalPaid);

const cuotas = [];
let i = 0;

while (i < 10) { 
  let baseExpectedAmount = i < inst ? scheduleAmounts[i] : pay;
  
  let isPaid = false;
  let paidAmt = 0;
  let requiredPay = 0;
  
  if (unallocatedPaid > 0) {
    const canCover = Math.min(baseExpectedAmount, unallocatedPaid);
    if (canCover >= baseExpectedAmount - 0.01) {
      isPaid = true;
      paidAmt = canCover;
      unallocatedPaid -= canCover;
    } else {
      paidAmt = canCover;
      unallocatedPaid -= canCover;
    }
  }

  if (paidAmt >= baseExpectedAmount - 0.01) {
    isPaid = true;
  } else {
    requiredPay = Math.min(baseExpectedAmount - paidAmt, Math.max(0, remainingPrincipal));
    if (requiredPay < 0.01) requiredPay = 0;
  }

  let expectedAmount = paidAmt + requiredPay;
  remainingPrincipal -= requiredPay;

  if (!isPaid && expectedAmount <= 0) {
    break;
  }
  
  // WAIT, what if it IS paid but we exceeded the installments?
  if (i >= inst && unallocatedPaid <= 0 && remainingPrincipal <= 0) {
    // Should we break here?
  }

  cuotas.push({ i, expectedAmount, isPaid, unallocatedPaid });
  i++;
}
console.log(cuotas);
