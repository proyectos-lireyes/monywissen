const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const targetStr = `  let autoCalculatedStart = false;
  if (settings.openingBalance !== undefined && settings.openingBalance !== null) {
    balance = settings.openingBalance;
  } else {
    balance = 0;`;

const replacement = `  let autoCalculatedStart = false;
  // If openingBalance is exactly 0 or undefined/null, we run the deficit calculator
  if (settings.openingBalance !== undefined && settings.openingBalance !== null && settings.openingBalance !== 0) {
    balance = settings.openingBalance;
  } else {
    balance = 0;`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('src/utils/financialEngine.ts', code);
    console.log("Patched openingBalance check successfully.");
} else {
    console.log("Could not find target block.");
}
