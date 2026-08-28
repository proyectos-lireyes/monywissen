import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));
// wait, we don't have the key, but maybe we can just look at how firebase is used.
