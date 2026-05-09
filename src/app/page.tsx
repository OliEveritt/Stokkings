export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Stokkings</h1>
      <p className="mt-4">Your group savings management platform</p>
      <div className="mt-6 space-x-4">
        <a href="/login" className="bg-emerald-600 text-white px-4 py-2 rounded">Login</a>
        <a href="/sign-up" className="text-emerald-600">Sign Up</a>
      </div>
    </main>
  );
}