import fs from 'fs';
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

let search = `    if (globalDisplayCurrency !== 'USD' && globalDisplayCurrency !== 'USD_BCV') {
        const rate = globalExchangeRates[globalDisplayCurrency];`;

let replace = `    let currencyKey = globalDisplayCurrency;
    if (currencyKey === 'EUR') currencyKey = 'EUR_BCV';

    if (globalDisplayCurrency !== 'USD' && globalDisplayCurrency !== 'USD_BCV') {
        const rate = globalExchangeRates[currencyKey];`;

content = content.replace(search, replace);
fs.writeFileSync('src/utils/financialEngine.ts', content);
