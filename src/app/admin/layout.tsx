import Link from 'next/link';
import '../globals.css';

// Admin root layout (§10). In production this segment is gated by Supabase Auth
// middleware (single admin); here it renders the dashboard shell. Marked
// noindex so it never appears in search.
export const metadata = { robots: { index: false, follow: false }, title: 'Admin · Irish Grid' };

const NAV = [
  ['/admin', 'Dashboard'],
  ['/admin/blog', 'Blog CMS'],
  ['/admin/social', 'Social'],
  ['/admin/translations', 'Translations'],
  ['/admin/submissions', 'Submissions'],
  ['/admin/pledges', 'Pledges'],
  ['/admin/press', 'Press'],
  ['/admin/assumptions', 'Assumptions'],
  ['/admin/settings', 'Settings'],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-navy-50">
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 bg-navy-700 p-4 text-white">
            <p className="mb-4 font-bold">Irish Grid <span className="text-sky-400">admin</span></p>
            <nav className="space-y-1 text-sm">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block rounded px-3 py-2 text-navy-50 hover:bg-navy-600">
                  {label}
                </Link>
              ))}
            </nav>
            <Link href="/" className="mt-6 block text-xs text-sky-400 hover:underline">← Back to site</Link>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
