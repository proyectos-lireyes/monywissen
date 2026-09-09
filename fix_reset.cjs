const fs = require('fs');
const p = 'src/components/settings/SettingsView.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/saveProfile\(\{ \.\.\.profile, overrides: currentOverrides \}\);/g, "updateProfileData(draft => { draft.overrides = currentOverrides; });");

fs.writeFileSync(p, txt);
