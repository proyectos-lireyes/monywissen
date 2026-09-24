const inst = 12;
const lifetimeTotal = 0; // Fully amortized

const scheduleAmounts = Array(12).fill(0);
let pay = 0; 
let totalPaid = 10; 
let unallocatedPaid = totalPaid;
let remainingPrincipal = 0;

const cuotas = [];
let i = 0;

while (i < 20) { 
  let baseExpectedAmount = 0;
  
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
  
  if (i >= inst && remainingPrincipal <= 0.01 && unallocatedPaid <= 0.01) {
      break;
  }

  cuotas.push({ i, expectedAmount, isPaid, unallocatedPaid, requiredPay });
  i++;
}
console.log(`Generated ${cuotas.length} cuotas`);
