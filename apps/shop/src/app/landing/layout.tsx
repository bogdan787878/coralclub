import { Analytics } from "@/components/landing/Analytics";

/** Everything under /landing shares the analytics runtime. */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
