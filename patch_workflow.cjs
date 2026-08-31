const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

code = code.replace(
  'uses: gradle/actions/setup-gradle@v3',
  'uses: gradle/actions/setup-gradle@v3\n        with:\n          gradle-version: "8.14.3"'
);

code = code.replace(
  'gradle wrapper\n          chmod +x gradlew',
  'gradle wrapper --gradle-version 8.14.3\n          chmod +x gradlew'
);

fs.writeFileSync('.github/workflows/build-apk.yml', code);
console.log("Patched build-apk.yml");
