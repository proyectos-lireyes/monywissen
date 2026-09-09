const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const doc = await db.collection('app_profiles').doc('default_profile').get();
  const data = doc.data();
  const overrides = data.overrides || {};
  console.log("Overrides keys:");
  Object.keys(overrides).forEach(k => {
    if (k.toLowerCase().includes('gasolina')) {
       console.log(k, overrides[k]);
    }
  });
  process.exit(0);
}
run();
