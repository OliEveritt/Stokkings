import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // SECURITY AUDIT: Check for active session
  if (!user) {
    // No session found -> send to Log-on
    redirect('/login');
  }

  // Session verified -> proceed to Dashboard
  redirect('/dashboard');
}