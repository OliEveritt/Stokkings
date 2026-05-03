import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Read the service account JSON file as a string
const keyPath = join(__dirname, 'stokvel-platform-e4318-firebase-adminsdk-fbsvc-f3c33ccb41.json');
const rawKey = readFileSync(keyPath, 'utf8');

// 2. Replace escaped newlines with real newlines (fixes private_key formatting)
const fixedKey = rawKey.replace(/\\n/g, '\n');

// 3. Parse into JSON object
const serviceAccount = JSON.parse(fixedKey);

// 4. Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function makeAdminOfAllGroups() {
  const uid = 'sY3Sb9oTiuhj3r28hc5bglAT13u1';   // uno's UID
  const email = 'uno@gmail.com';

  // Fetch all groups
  const groupsSnapshot = await db.collection('groups').get();

  if (groupsSnapshot.empty) {
    console.log('No groups found.');
    return;
  }

  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id;
    const memberRef = db.doc(`groups/${groupId}/group_members/${uid}`);

    await memberRef.set(
      {
        userId: uid,
        email: email,
        role: 'Admin',
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ Admin added for group: ${groupId} (${groupDoc.data().group_name || 'Unnamed'})`);
  }

  console.log('🎉 Done! uno@gmail.com is now admin of all groups.');
}

makeAdminOfAllGroups()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });