import fs from 'fs';

function fix(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Find the broken section:
    const search = `(globalFormatted.includes('  };`;
    const replace = `(globalFormatted.includes('$') && !globalFormatted.includes('Bs') && sym !== '$');

    if (isDifferentCurrency) {
        return \`\${raw} (~ \${globalFormatted})\`;
    }
    return raw;
  };`;

    if (content.includes(search)) {
        content = content.replace(search, replace);
        fs.writeFileSync(filename, content);
    }
}

fix('src/components/debts/DebtsView.tsx');
fix('src/components/modals/ItemFormModal.tsx');
