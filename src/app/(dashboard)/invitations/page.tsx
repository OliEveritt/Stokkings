import { redirect } from "next/navigation";

export default function InvitationsRedirect() {
  // Redirecting to the specific GeneralTest group ID from your Firestore
  redirect("/groups/5OH8mq7aM4oPJVSdJ7Zo/invite");
}