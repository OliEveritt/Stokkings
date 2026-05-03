import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Option 1: Use the file path directly (recommended)
const serviceAccountPath = './stokvel-platform-e4318-firebase-adminsdk-fbsvc-f3c33ccb41.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
}

const db = admin.firestore();

async function makeUnoAdminOfAllGroups() {
  const uid = 'sY3Sb9oTiuhj3r28hc5bglAT13u1';
  const email = 'uno@gmail.com';

  const groupsSnapshot = await db.collection('groups').get();
  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id;
    const memberRef = db.doc(`groups/${groupId}/group_members/${uid}`);
    await memberRef.set({
      userId: uid,
      email: email,
      role: 'Admin',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    }, { merge: true });
    console.log(`✅ Admin added for group ${groupId}`);
  }
  console.log('🎉 Done! uno@gmail.com is now admin of all groups.');
}

makeUnoAdminOfAllGroups().then(() => process.exit(0)).catch(console.error);