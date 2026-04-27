import { auth as firebaseAuth } from "@/lib/firebase";

/**
 *
 */
export async function getServerSession() {
  const user = firebaseAuth.currentUser;

  if (!user) return null;

  return {
    user: {
      id: user.uid,
      email: user.email,
      name: user.displayName,
    },
  };
}