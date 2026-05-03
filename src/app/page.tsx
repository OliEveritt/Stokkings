import { redirect } from 'next/navigation';

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await the params to ensure token/groupId are not undefined
  const { token, groupId } = await searchParams;

  // 2. If this is an invitation, carry the context to the sign-up page
  if (token && groupId) {
    redirect(`/sign-up?token=${token}&groupId=${groupId}`);
  }

  // 3. Otherwise, standard redirect to login
  redirect('/login');
}