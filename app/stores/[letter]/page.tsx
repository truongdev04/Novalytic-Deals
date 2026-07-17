import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStores, getCoupons, groupStoresByLetter } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AlphabetNav } from "@/components/store/AlphabetNav";
import { StoreCard } from "@/components/store/StoreCard";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

function toGroupKey(letterParam: string): string | null {
  if (letterParam === "0-9") return "#";
  if (/^[A-Za-z]$/.test(letterParam)) return letterParam.toUpperCase();
  return null;
}

export async function generateStaticParams() {
  const groups = groupStoresByLetter(await getStores());
  return [...groups.keys()].map((key) => ({ letter: key === "#" ? "0-9" : key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter: letterParam } = await params;
  const key = toGroupKey(letterParam);
  if (!key) return {};

  const displayLetter = key === "#" ? "0-9" : key;
  return buildMetadata({
    title: `Stores starting with "${displayLetter}" — Coupons & Deals`,
    description: `Browse verified coupon codes and deals from stores starting with "${displayLetter}".`,
    path: `/stores/${letterParam}`,
  });
}

export default async function StoreLetterPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter: letterParam } = await params;
  const key = toGroupKey(letterParam);
  if (!key) notFound();

  const stores = await getStores();
  const groups = groupStoresByLetter(stores);
  const letterStores = groups.get(key);
  if (!letterStores || letterStores.length === 0) notFound();

  const allCoupons = await getCoupons();
  const couponCountByStore = new Map<string, number>();
  for (const coupon of allCoupons) {
    couponCountByStore.set(coupon.storeId, (couponCountByStore.get(coupon.storeId) ?? 0) + 1);
  }

  const displayLetter = key === "#" ? "0-9" : key;

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { name: "Stores", path: "/stores" },
          { name: displayLetter, path: `/stores/${letterParam}` },
        ]}
      />

      <div className="mt-6">
        <AlphabetNav availableLetters={new Set(groups.keys())} activeLetter={key} />
      </div>

      <div className="mt-8 flex items-end gap-4">
        <span className="font-heading text-6xl font-bold text-brand-600">{displayLetter}</span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">
            Stores starting with &quot;{displayLetter}&quot;
          </h1>
          <p className="mt-1 text-sm text-muted-600">
            Showing {letterStores.length} {letterStores.length === 1 ? "store" : "stores"} —
            browse verified coupons and deals below.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {letterStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            couponCount={couponCountByStore.get(store.id) ?? 0}
          />
        ))}
      </div>
    </Container>
  );
}
