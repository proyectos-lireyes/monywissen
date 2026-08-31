const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

// Change assembleRelease to assembleDebug
code = code.replace(
  './gradlew assembleRelease --no-daemon',
  './gradlew assembleDebug --no-daemon'
);

// Remove the signing step entirely since debug is auto-signed
const signingStepRegex = /      - name: 10\. Firmar APK[\s\S]*?(?=      - name: 11\. Guardar Artefacto APK)/;
code = code.replace(signingStepRegex, '');

// Update step numbers
code = code.replace('11. Guardar', '10. Guardar');
code = code.replace('12. Renombrar', '11. Renombrar');
code = code.replace('13. Crear Release', '12. Crear Release');

// Change paths from release/app-release.apk to debug/app-debug.apk
code = code.replace(/outputs\/apk\/release\/app-release\.apk/g, 'outputs/apk/debug/app-debug.apk');
code = code.replace(/outputs\/apk\/release\/monywissen/g, 'outputs/apk/debug/monywissen');
code = code.replace(/outputs\/apk\/release\/monywissen-\*\.apk/g, 'outputs/apk/debug/monywissen-*.apk');


fs.writeFileSync('.github/workflows/build-apk.yml', code);
console.log("Patched to Debug APK");
