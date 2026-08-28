const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(
  `                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />`,
  `                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["rescates"]} dataKey="rescates" stackId="opt" yAxisId="left" fill="#0ea5e9" name="Rescate de Ahorros" barSize={12} radius={[4,4,0,0]} />`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched to add rescates bar");
