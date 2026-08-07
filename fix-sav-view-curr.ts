import fs from 'fs';
let content = fs.readFileSync('src/components/savings/SavingsView.tsx', 'utf8');

content = content.replace(
  'const { profile, updateProfileData, showToast } = useApp();',
  'const { profile, updateProfileData, showToast, convertAmount } = useApp();'
);

content = content.replace(
  '      if (x.savType === \'digital\') digitalTotal += x.amount;\n      else physicalTotal += x.amount;',
  '      const amt = convertAmount(x.amount, x.currency);\n      if (x.savType === \'digital\') digitalTotal += amt;\n      else physicalTotal += amt;'
);

content = content.replace(
  '<td className="py-3 font-black text-emerald-600">{formatCurrency(item.amount)}</td>',
  '<td className="py-3 font-black text-emerald-600">{formatCurrency(convertAmount(item.amount, item.currency))}</td>'
);

fs.writeFileSync('src/components/savings/SavingsView.tsx', content);
