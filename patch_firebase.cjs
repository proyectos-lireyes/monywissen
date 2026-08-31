const fs = require('fs');
let code = fs.readFileSync('src/utils/firebase.ts', 'utf8');

if (!code.includes('getUserProfileByEmail')) {
    const fn = `
export async function getUserProfileByEmail(email: string) {
  try {
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (e) {
    return null;
  }
}
`;
    code += fn;
    fs.writeFileSync('src/utils/firebase.ts', code);
}
console.log("Patched firebase.ts");
