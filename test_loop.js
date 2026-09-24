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
let remainingPrincipal = lifetimeTotal;

const cuotas = [];
let i = 0;

while (i < 10) { // max 10 for test
  let baseExpectedAmount = i < inst ? scheduleAmounts[i] : pay;
  
  let isPaid = false;
  let paidAmt = 0;
  let requiredPay = 0;
  let expectedAmount = baseExpectedAmount;

  if (paidAmt >= baseExpectedAmount - 0.01) {
    isPaid = true;
  } else {
    requiredPay = Math.min(baseExpectedAmount - paidAmt, Math.max(0, remainingPrincipal));
    if (requiredPay < 0.01) requiredPay = 0;
    expectedAmount = paidAmt + requiredPay;
    remainingPrincipal -= requiredPay;
  }

  if (!isPaid && expectedAmount <= 0) {
    break;
  }

  cuotas.push({ i, expectedAmount, isPaid });
  i++;
}

console.log(cuotas);
