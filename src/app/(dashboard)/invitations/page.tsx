import { redirect } from "next/navigation";

export default function InvitationsRedirect() {
  // Change this from "/dashboard" to your dynamic invite path
  redirect("/groups/TestGroup/invite");
}