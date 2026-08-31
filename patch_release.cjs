const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

// Change debug to release
code = code.replace(/assembleDebug/g, 'assembleRelease');
code = code.replace(/outputs\/apk\/debug\/app-debug\.apk/g, 'outputs/apk/release/app-release.apk');
code = code.replace(/outputs\/apk\/debug\/monywissen/g, 'outputs/apk/release/monywissen');

// Insert signing step
const signingStep = `      - name: 10. Firmar APK (Release)
        run: |
          echo "Firmando el APK con keystore local..."
          APKSIGNER=$(find $ANDROID_HOME/build-tools -name apksigner | sort -r | head -n 1)
          $APKSIGNER sign --ks android/app/release.keystore \\
            --ks-key-alias monywissen \\
            --ks-pass pass:monywissen2026 \\
            --key-pass pass:monywissen2026 \\
            --out android/app/build/outputs/apk/release/app-release.apk \\
            android/app/build/outputs/apk/release/app-release-unsigned.apk
`;
code = code.replace('      - name: 10. Guardar', signingStep + '      - name: 11. Guardar');
code = code.replace('      - name: 11. Renombrar', '      - name: 12. Renombrar');
code = code.replace('      - name: 12. Crear Release', '      - name: 13. Crear Release');

fs.writeFileSync('.github/workflows/build-apk.yml', code);
console.log("Patched to Release APK with local Keystore");
