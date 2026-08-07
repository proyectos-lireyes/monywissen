import fs from 'fs';
let content = fs.readFileSync('src/components/savings/SavingsView.tsx', 'utf8');

const target1 = `  let physicalTotal = profile.savings?.current || 0;
  let digitalTotal = 0;`;
const replacement1 = `  let physicalTotal = profile.savings?.current || 0;
  let digitalTotal = profile.savings?.digital || 0;`;

const target2 = `  const handleAdjustBase = () => {
    const physStr = prompt('Monto base ahorrado en EFECTIVO (Físico):', String(profile.savings?.current || 0));
    if (physStr === null) return;

    updateProfileData(draft => {
      draft.savings = {
        current: parseFloat(physStr) || 0,
        digital: 0,
      };
    });

    showToast('Base histórica de ahorros actualizada', '⚙️');
  };`;
const replacement2 = `  const handleAdjustBase = () => {
    const physStr = prompt('Monto base ahorrado en EFECTIVO (Físico):', String(profile.savings?.current || 0));
    if (physStr === null) return;
    const digStr = prompt('Monto base ahorrado DIGITAL (Billeteras):', String(profile.savings?.digital || 0));
    if (digStr === null) return;

    updateProfileData(draft => {
      draft.savings = {
        current: parseFloat(physStr) || 0,
        digital: parseFloat(digStr) || 0,
      };
    });

    showToast('Base histórica de ahorros actualizada', '⚙️');
  };`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync('src/components/savings/SavingsView.tsx', content);
