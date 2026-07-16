import { MarketplaceCatalog } from "@/components/marketplace/marketplace-catalog";
import { ProductShell } from "@/components/shared/product-shell";
import { getMarketplaceTasks } from "./marketplace-data";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  minReward?: string;
  available?: string;
}>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tasks = await getMarketplaceTasks({});

  return (
    <ProductShell active="marketplace">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section aria-labelledby="marketplace-heading">
          <p className="text-sm font-medium text-[var(--accent)]">
            Funded work, ready now
          </p>
          <h1
            id="marketplace-heading"
            className="mt-2 max-w-2xl text-[32px] leading-[35px] font-medium"
          >
            Earn money completing real tasks
          </h1>
          <p className="mt-3 max-w-[68ch] text-[var(--muted)]">
            Claim a funded slot, follow the proof requirements, and get paid
            when the business approves your work.
          </p>
        </section>
        <MarketplaceCatalog
          tasks={tasks}
          initialFilters={{
            query: params.q ?? "",
            category: params.category ?? "",
            minimumReward: params.minReward ?? "",
            availableOnly: params.available === "1",
          }}
        />
      </div>
    </ProductShell>
  );
}
