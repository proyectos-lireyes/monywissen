import { getDefaultSeed } from './src/types';
import { calculateProjections } from './src/utils/financialEngine';
import { validateFinancialIntegrity } from './src/utils/financialIntegrity';

const profile = getDefaultSeed().profiles.Personal;
const exchangeRates = { 'USD_BCV': 1, 'USDT': 1, 'BS': 0.02, 'EUR_BCV': 1.05 };

try {
  const plan = calculateProjections(profile, exchangeRates);
  console.log("Plan length:", plan.length);
  const report = validateFinancialIntegrity(profile, exchangeRates);
  console.log("Report generated successfully");
} catch (e) {
  console.error("CRASH:", e);
}
