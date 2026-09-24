let baseExpectedAmount = 0;
let unallocatedPaid = 1;
let isPaid = false;
let paidAmt = 0;

if (unallocatedPaid > 0) {
  const canCover = Math.min(baseExpectedAmount, unallocatedPaid);
  if (canCover >= baseExpectedAmount - 0.01) {
    isPaid = true;
    paidAmt = canCover;
    unallocatedPaid -= canCover;
  }
}
console.log({isPaid, paidAmt, unallocatedPaid});
