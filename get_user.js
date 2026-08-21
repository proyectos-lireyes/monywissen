import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

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
    console.log("Settings:", JSON.stringify(data.settings, null, 2));
    console.log("Savings:", JSON.stringify(data.savingsList, null, 2));
  });
}
run().then(() => process.exit(0));
