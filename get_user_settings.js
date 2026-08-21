import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const userDoc = await getDoc(doc(db, "users", "lissandro.reyes.ggpro.0128@gmail.com"));
  if (userDoc.exists()) {
    console.log(JSON.stringify(userDoc.data(), null, 2));
  } else {
    console.log("No user doc found.");
  }
  process.exit(0);
}
run();
