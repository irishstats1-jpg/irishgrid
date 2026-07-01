import Link from 'next/link';

// 404 within the localised site — renders inside the locale layout (header/footer).
export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl font-bold text-navy-900">Page not found</h1>
      <p className="prose-body mt-3 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
