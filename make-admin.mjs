import admin from 'firebase-admin';
import 'dotenv/config';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

const TARGET_UID = process.env.MAKE_ADMIN_UID;
const TARGET_EMAIL = process.env.MAKE_ADMIN_EMAIL;

if (!TARGET_UID || !TARGET_EMAIL) {
  console.error('Set MAKE_ADMIN_UID and MAKE_ADMIN_EMAIL env vars before running.');
  process.exit(1);
}

async function makeAdminOfAllGroups() {
  const groupsSnapshot = await db.collection('groups').get();

  if (groupsSnapshot.empty) {
    console.log('No groups found.');
    return;
  }

  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id;
    const memberRef = db.doc(`groups/${groupId}/group_members/${TARGET_UID}`);

    await memberRef.set(
      {
        userId: TARGET_UID,
        email: TARGET_EMAIL,
        role: 'Admin',
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Admin added for group: ${groupId} (${groupDoc.data().group_name || 'Unnamed'})`);
  }

  console.log(`Done. ${TARGET_EMAIL} is now admin of all groups.`);
}

makeAdminOfAllGroups()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
