const fs = require('fs');
let code = fs.readFileSync('src/utils/firebase.ts', 'utf8');

if (!code.includes('updateUserAvatar')) {
    const fn = `
export async function updateUserAvatar(email: string, avatarDataUrl: string | null) {
  try {
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, { avatar: avatarDataUrl }, { merge: true });
  } catch (e) {
    console.error(e);
  }
}
`;
    code += fn;
    fs.writeFileSync('src/utils/firebase.ts', code);
}

let topBarCode = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');
if (!topBarCode.includes('updateUserAvatar')) {
    topBarCode = topBarCode.replace("import { AvatarViewerModal } from '../modals/AvatarViewerModal';", "import { AvatarViewerModal } from '../modals/AvatarViewerModal';\nimport { updateUserAvatar } from '../../utils/firebase';");
    topBarCode = topBarCode.replace('// Ideally also save to firebase', 'if (state.authUser?.email) updateUserAvatar(state.authUser.email, b64);');
    topBarCode = topBarCode.replace('updateProfileData(draft => { delete draft.avatar; });', 'updateProfileData(draft => { delete draft.avatar; });\n          if (state.authUser?.email) updateUserAvatar(state.authUser.email, null);');
    fs.writeFileSync('src/components/layout/TopBar.tsx', topBarCode);
}

let profileModalCode = fs.readFileSync('src/components/modals/ProfileModal.tsx', 'utf8');
if (!profileModalCode.includes('updateUserAvatar')) {
    profileModalCode = profileModalCode.replace("import { useApp } from '../../context/AppContext';", "import { useApp } from '../../context/AppContext';\nimport { updateUserAvatar } from '../../utils/firebase';");
    profileModalCode = profileModalCode.replace("updateProfileData(draft => { draft.avatar = b64; });", "updateProfileData(draft => { draft.avatar = b64; });\n          if (state.authUser?.email) updateUserAvatar(state.authUser.email, b64);");
    profileModalCode = profileModalCode.replace("updateProfileData(draft => { delete draft.avatar; });", "updateProfileData(draft => { delete draft.avatar; });\n          if (state.authUser?.email) updateUserAvatar(state.authUser.email, null);");
    fs.writeFileSync('src/components/modals/ProfileModal.tsx', profileModalCode);
}
console.log("Patched avatar fb");
