import fs from 'fs';

const file = 'src/components/modals/ItemFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\(globalFormatted\.includes\('[^]*?};/m;
const replace = `(globalFormatted.includes('$') && !globalFormatted.includes('Bs') && sym !== '$');

    if (isDifferentCurrency) {
        return \`\${raw} (~ \${globalFormatted})\`;
    }
    return raw;
  };`;

content = content.replace(regex, replace);
fs.writeFileSync(file, content);

const file2 = 'src/components/debts/DebtsView.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(regex, replace);
fs.writeFileSync(file2, content2);
