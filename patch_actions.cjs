const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

code = code.replace(
  'uses: actions/setup-java@v4',
  'uses: actions/setup-java@v5'
);

code = code.replace(
  'uses: gradle/actions/setup-gradle@v3',
  'uses: gradle/actions/setup-gradle@v4'
);

code = code.replace(
  'uses: softprops/action-gh-release@v1',
  'uses: softprops/action-gh-release@v2'
);

fs.writeFileSync('.github/workflows/build-apk.yml', code);
console.log("Patched actions in build-apk.yml");
