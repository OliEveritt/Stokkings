import { redirect } from 'next/navigation';

export default function RootPage() {
  // Direct entry into the dashboard ledger
  redirect('/dashboard');
}