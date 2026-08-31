const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

code = code.replace(
  /gradle-version: "8.14.3"/g, 
  'gradle-version: "8.14.3"\n          validate-wrappers: false'
);

fs.writeFileSync('.github/workflows/build-apk.yml', code);
console.log("Patched validate-wrappers in build-apk.yml");
