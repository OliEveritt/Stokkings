import { redirect } from 'next/navigation';

export default async function RootPage() {
  // Redirect to login page - auth check happens client-side
  redirect('/login');
}