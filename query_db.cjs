const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const doc = await db.collection('app_profiles').doc('default_profile').get();
  const data = doc.data();
  console.log("Expenses:");
  (data.expenses || []).forEach(e => {
    console.log(`- ${e.name}: strictDate=${e.strictDate}`);
  });
  process.exit(0);
}
run();
