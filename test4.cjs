const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /const \{ profile, updateProfileData, showToast, validateTransaction, convertAmount \} = useApp\(\);/g,
  'const { profile, updateProfileData, showToast, validateTransaction, convertAmount, exchangeRates } = useApp();'
);

content = content.replace(
  /const plan = calculateAmortizationPlan\(dummyItem, profile\.overrides \|\| \{\}, profile\.settings\.customDebts \|\| \[\]\);/g,
  'const plan = calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || [], undefined, exchangeRates);'
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
