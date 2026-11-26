import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RuPdp } from "@/components/ru/RuPdp";
import { RU_PRODUCTS, ruProduct, ruTitle } from "@/lib/ru/shop";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return RU_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = ruProduct((await params).slug);
  return p ? { title: `${ruTitle(p)} — Coral Club`, robots: { index: false, follow: false } } : {};
}

export default async function RuProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!ruProduct(slug)) notFound();
  return <RuPdp slug={slug} />;
}
