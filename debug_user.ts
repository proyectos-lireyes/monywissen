import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calculateProjections } from './src/utils/financialEngine';

const app = initializeApp({ projectId: 'ai-studio-monywissen-7a874d38-9ebf-4077-a9f7-cbb1e4961bd3' });
const db = getFirestore(app);

async function run() {
  const userDoc = await db.collection('users').doc('lissandro.reyes.ggpro.0128@gmail.com').get();
  const data = userDoc.data();
  if (!data) return console.log('User not found');
  
  const plan = calculateProjections(data, { 'USD': 1 });
  
  console.log('--- Rescates ---');
  plan.filter(p => p.type === 'rescate_ahorros').forEach(p => console.log(p.date, p.amt, p.balance));
  
  console.log('--- Ahorro ---');
  plan.filter(p => p.label.includes('Excedente pre-ingreso')).forEach(p => console.log(p.date, p.amt, p.balance));
  
  console.log('--- Day 12 ---');
  plan.filter(p => p.date === '2026-09-12').forEach(p => console.log(p.date, p.type, p.label, p.amt, p.balance));
}
run().catch(console.error);
