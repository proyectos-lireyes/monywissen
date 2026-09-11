import fs from 'fs';

let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const searchStr = `                        if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
                           // If somehow it's native but in settings, delegate to AppUpdaterModal or window.open
                           window.open(updateState.downloadUrl, '_system');
                        } else {`;

const replaceStr = `                        if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
                           import('@capawesome-team/capacitor-file-opener').then(({ FileOpener }) => {
                             FileOpener.openFile({
                               path: updateState.downloadUrl,
                               mimeType: 'application/vnd.android.package-archive'
                             }).catch(err => {
                               console.error('Error abriendo APK', err);
                               showToast('Error al abrir el instalador', '❌');
                             });
                           }).catch(() => {
                             window.open(updateState.downloadUrl, '_system');
                           });
                        } else {`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/components/settings/SettingsView.tsx', content, 'utf8');
