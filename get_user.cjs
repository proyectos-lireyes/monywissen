const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const users = await db.collection('users').where('email', '==', 'lissandro.reyes.ggpro.0128@gmail.com').get();
  users.forEach(doc => {
    const data = doc.data();
    console.log("Incomes:", JSON.stringify(data.incomes, null, 2));
    console.log("Settings:", JSON.stringify(data.settings, null, 2));
  });
}
run().then(() => process.exit(0));
