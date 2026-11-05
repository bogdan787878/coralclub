/**
 * Wraps the home page and the PDP in the mobile-canvas-grown-desktop
 * column (see .appShell in globals.css). Account/quiz screens live
 * outside this group — they render their own full-viewport backdrop
 * with a centered card and must not be capped to this column.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className="appShell">{children}</div>;
}
