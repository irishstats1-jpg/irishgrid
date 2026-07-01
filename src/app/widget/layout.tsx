import '../globals.css';

// Minimal root layout for bare, iframe-embeddable widgets (§14) — no header/footer.
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
