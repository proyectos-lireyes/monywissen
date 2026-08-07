import fs from 'fs';

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

// In income creation/update
content = content.replace(
  '          tags: tags ? tags.split(\',\').map(t => t.trim()).filter(Boolean) : undefined,\n          currency: currency as any,',
  '          tags: tags ? tags.split(\',\').map(t => t.trim()).filter(Boolean) : undefined,\n          currency: currency as any,\n          receiptImg: receiptImg || undefined,'
);

// In expense creation/update
content = content.replace(
  '          category: category || undefined,\n          tags: tags ? tags.split(\',\').map(t => t.trim()).filter(Boolean) : undefined,\n          currency: currency as any,',
  '          category: category || undefined,\n          tags: tags ? tags.split(\',\').map(t => t.trim()).filter(Boolean) : undefined,\n          currency: currency as any,\n          receiptImg: receiptImg || undefined,'
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
