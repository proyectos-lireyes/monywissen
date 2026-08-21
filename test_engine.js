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
  console.log("Current Profile name:", data.currentProfile);
  console.log("ALL PROFILES KEYS:", Object.keys(data.profiles));
  const activeProfile = data.profiles[data.currentProfile];
  console.log("Active Profile opening balance:", activeProfile.settings?.openingBalance);
  process.exit(0);
}
run();
