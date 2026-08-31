const fs = require('fs');

let viewerCode = fs.readFileSync('src/components/modals/AvatarViewerModal.tsx', 'utf8');
viewerCode = viewerCode.replace('<input \n         type="file"\n         accept="image/*"\n         ref={fileInputRef}', '<input \n         type="file"\n         accept="image/*"\n         capture="user"\n         ref={fileInputRef}');
fs.writeFileSync('src/components/modals/AvatarViewerModal.tsx', viewerCode);

let topBarCode = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');
// Let's add the AvatarViewerModal to TopBar
if (!topBarCode.includes('AvatarViewerModal')) {
    topBarCode = topBarCode.replace("import { useApp } from '../../context/AppContext';", "import { useApp } from '../../context/AppContext';\nimport { AvatarViewerModal } from '../modals/AvatarViewerModal';");
    topBarCode = topBarCode.replace('const [showCurrencyModal, setShowCurrencyModal] = useState(false);', 'const [showCurrencyModal, setShowCurrencyModal] = useState(false);\n  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);');
    topBarCode = topBarCode.replace('onClick={onOpenProfile}', 'onClick={() => setAvatarViewerOpen(true)}');
    const modalStr = `      <AvatarViewerModal 
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        imageUrl={profile.avatar || null}
        title={currentProfileName}
        canEdit={true}
        onImageUpload={(b64) => {
          updateProfileData(draft => { draft.avatar = b64; });
          // Ideally also save to firebase
        }}
        onImageDelete={() => {
          updateProfileData(draft => { delete draft.avatar; });
        }}
      />
    </header>`;
    topBarCode = topBarCode.replace('</header>', modalStr);
    fs.writeFileSync('src/components/layout/TopBar.tsx', topBarCode);
}
console.log("Patched avatar");
