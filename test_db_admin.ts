import * as admin from "firebase-admin";
import { calculateProjections } from './src/utils/financialEngine';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "ai-studio-monywissen-7a874d38-9ebf-4077-a9f7-cbb1e4961bd3"
  });
}
const db = admin.firestore();

async function main() {
  const ref = db.collection("users").doc("lissandro.reyes.ggpro.0128@gmail.com");
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data();
    const plan = calculateProjections(data as any, {});
    const deficits = plan.filter((e: any) => e.balance < 0 && e.amt < 0 && !e.done);
    console.log("Deficits count:", deficits.length);
    deficits.forEach(d => console.log(`Deficit: ${d.date} | ${d.label} | amt: ${d.amt} | bal: ${d.balance}`));
    
    console.log("--- Full Plan (first 20) ---");
    plan.slice(0, 20).forEach((e: any) => console.log(`${e.date} | ${e.label} | amt: ${e.amt} | bal: ${e.balance} | done: ${e.done}`));
  } else {
    console.log("User not found");
  }
}
main().catch(console.error);
