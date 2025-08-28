// This is a simple layout for public-facing pages that do not require the main sidebar or authentication checks.
// It ensures these pages are rendered within the root layout's context (<html>, <body>, providers) without adding extra elements.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
