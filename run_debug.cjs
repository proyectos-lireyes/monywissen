const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');
require('ts-node').register({
  compilerOptions: { module: 'commonjs', esModuleInterop: true, skipLibCheck: true }
});

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  try {
      const doc = await db.collection('app_profiles').doc('default_profile').get();
      const profile = doc.data();
      const { calculateProjections } = require('./src/utils/financialEngine');
      
      const plan = calculateProjections(profile, {});
      console.log("Plan length:", plan.length);
      const req = plan.find(p => p.ref && p.ref.id === 'required_starting_fund');
      console.log("Required fund:", req);
  } catch (e) {
      console.error(e);
  }
  process.exit(0);
}
run();
