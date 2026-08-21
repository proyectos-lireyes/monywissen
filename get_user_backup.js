import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const userDoc = await getDoc(doc(db, "backups", "lissandro.reyes.ggpro.0128@gmail.com"));
  let data = userDoc.data().dataPayload;
  if (typeof data === 'string') data = JSON.parse(data);
  const profiles = data.profiles;
  if (profiles) {
    console.log(Object.keys(profiles));
    for (const key in profiles) {
       console.log("Profile", key, "settings:", profiles[key].settings?.openingBalance);
    }
  }
  process.exit(0);
}
run();
