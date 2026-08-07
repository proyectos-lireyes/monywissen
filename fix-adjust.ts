import fs from 'fs';
let content = fs.readFileSync('src/components/savings/SavingsView.tsx', 'utf8');

const targetAdjust = `  const handleAdjustBase = () => {
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

const replacementAdjust = `  const handleAdjustBase = () => {
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

content = content.replace(targetAdjust, replacementAdjust);

// Also set `let digitalTotal = 0;` instead of `profile.savings?.digital || 0`
content = content.replace(
  'let digitalTotal = profile.savings?.digital || 0;',
  'let digitalTotal = 0;'
);

fs.writeFileSync('src/components/savings/SavingsView.tsx', content);
