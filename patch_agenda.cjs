const fs = require('fs');
let code = fs.readFileSync('src/components/shared/MonySharedView.tsx', 'utf8');

if (!code.includes('contactAvatars')) {
    code = code.replace("import { useApp } from '../../context/AppContext';", "import { useApp } from '../../context/AppContext';\nimport { getUserProfileByEmail } from '../../utils/firebase';");
    
    code = code.replace("const [qrScanInput, setQrScanInput] = useState('');", "const [qrScanInput, setQrScanInput] = useState('');\n  const [contactAvatars, setContactAvatars] = useState<Record<string, string>>({});");
    
    const effectStr = `
  useEffect(() => {
    const fetchAvatars = async () => {
      if (!profile.settings.contacts) return;
      const newAvatars = { ...contactAvatars };
      let changed = false;
      for (const c of profile.settings.contacts) {
        if (c.email && !newAvatars[c.email]) {
          const userProf = await getUserProfileByEmail(c.email);
          if (userProf && userProf.avatar) {
            newAvatars[c.email] = userProf.avatar;
            changed = true;
          }
        }
      }
      if (changed) setContactAvatars(newAvatars);
    };
    fetchAvatars();
  }, [profile.settings.contacts]);
`;
    code = code.replace("const [genericConfirm, setGenericConfirm] = useState<{message: string, onConfirm: () => void} | null>(null);", "const [genericConfirm, setGenericConfirm] = useState<{message: string, onConfirm: () => void} | null>(null);\n" + effectStr);
    
    code = code.replace('{c.avatar ? (', '{(c.avatar || contactAvatars[c.email]) ? (');
    code = code.replace('<img src={c.avatar} alt={c.alias} className="w-full h-full object-cover" />', '<img src={c.avatar || contactAvatars[c.email]} alt={c.alias} className="w-full h-full object-cover" />');
    fs.writeFileSync('src/components/shared/MonySharedView.tsx', code);
}
console.log("Patched agenda");
