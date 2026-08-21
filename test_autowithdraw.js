const targetMin = 100;
let balance = 50;
let savingsAccumulated = 200;
let plan = [];

if (balance < targetMin && savingsAccumulated > 0) {
    const deficit = targetMin - balance;
    const amountToWithdraw = Math.min(deficit, savingsAccumulated);
    balance += amountToWithdraw;
    savingsAccumulated -= amountToWithdraw;
    plan.push({
        label: 'Rescate',
        amt: amountToWithdraw,
        balance,
        savingsAccumulated
    });
}
console.log(plan);
