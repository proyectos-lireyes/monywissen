const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(
  `    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      if (e?.amt > 0 && (e.type === 'income')) {
         chartDataMap[e.originalDate].plannedIncome += e?.amt;
      }
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
         chartDataMap[e.originalDate].plannedEgresos += Math.abs(e?.amt);
      }
    }`,
  `    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      if (!chartDataMap[e.originalDate]) {
        chartDataMap[e.originalDate] = {
           date: e.originalDate,
           label: e.originalDate.substring(5, 10),
           balance: 0,
           income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, rescates: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: []
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) {
         chartDataMap[e.originalDate].plannedIncome = (chartDataMap[e.originalDate].plannedIncome || 0) + e?.amt;
      }
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
         chartDataMap[e.originalDate].plannedEgresos = (chartDataMap[e.originalDate].plannedEgresos || 0) + Math.abs(e?.amt);
      }
    }`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched chartDataMap originalDate");
