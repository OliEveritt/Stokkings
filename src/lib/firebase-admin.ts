import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

function getCredentials() {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  // 1. Local JSON file
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = fs.readFileSync(resolvedPath, "utf8");

        console.log(
          "✅ Firebase Admin initialized using service account JSON."
        );

        return cert(JSON.parse(fileContent));
      } catch (err) {
        console.error("❌ Failed to parse Firebase JSON:", err);
      }
    }
  }

  // 2. Environment variables fallback
  console.log(
    "ℹ️ Firebase Admin using environment variable credentials."
  );

  return cert({
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,

    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
  });
}

// Initialize ONCE only
if (!getApps().length) {
  initializeApp({
    credential: getCredentials(),
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();