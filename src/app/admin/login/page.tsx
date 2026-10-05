import { AdminLoginForm } from '@/components/AdminLoginForm';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Admin sign in</h1>
      <p className="mt-1 text-sm text-ink-600">Restricted to the administrators listed in the site configuration.</p>
      <AdminLoginForm initialError={error ? error.slice(0, 120) : undefined} />
    </div>
  );
}
