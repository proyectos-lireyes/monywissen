import fs from 'fs';
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /savType,\n          currency: currency as any,/g,
  "savType,\n          platformId: savType === 'digital' ? savPlatform : undefined,\n          currency: currency as any,"
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
