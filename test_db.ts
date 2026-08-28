import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0262909179",
  appId: "1:987406631845:web:5be8d650def4919064de4c",
  apiKey: "AIzaSyBdpN1Yh_0Urm0iIA_iCY987jhfy0z9xME",
  authDomain: "gen-lang-client-0262909179.firebaseapp.com",
  storageBucket: "gen-lang-client-0262909179.firebasestorage.app",
  messagingSenderId: "987406631845"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-monywissen-7a874d38-9ebf-4077-a9f7-cbb1e4961bd3");

async function run() {
  const userEmail = "lissandro.reyes.ggpro.0128@gmail.com";
  const snap = await getDoc(doc(db, "backups", userEmail));
  const data = snap.data()?.dataPayload;
  
  if (!data) {
    console.log("No data");
    process.exit(1);
  }
  
  console.log("Current Profile:", data.currentProfile);
  for (const k of Object.keys(data.profiles)) {
     const p = data.profiles[k];
     console.log(`\n--- Profile: ${k} ---`);
     console.log("Settings:", p.settings);
     console.log("Incomes:", p.incomes?.map(i => i.name));
     console.log("Expenses:", p.expenses?.map(e => e.name));
     console.log("Debts:", p.debts?.map(d => d.name));
     console.log("Overrides keys:", Object.keys(p.overrides || {}));
  }
  process.exit(0);
}
run();
