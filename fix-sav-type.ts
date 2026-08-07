import fs from 'fs';
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  "  const [savType,          platformId: savType === 'digital' ? savPlatform : undefined, setSavType] = useState<'physical' | 'digital'>('physical');",
  "  const [savType, setSavType] = useState<'physical' | 'digital'>('physical');"
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
