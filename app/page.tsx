import { TaskCard } from "@/components/marketplace/task-card";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { ProductShell } from "@/components/shared/product-shell";
import Link from "next/link";
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
  const minimumReward = Number.parseInt(params.minReward ?? "", 10);
  const tasks = await getMarketplaceTasks({
    query: params.q,
    category: params.category || undefined,
    availableOnly: params.available === "1",
    minimumRewardCents: Number.isFinite(minimumReward)
      ? minimumReward
      : undefined,
  });
  const featuredTasks = tasks
    .filter((task) => task.claimedSlots < task.slotCapacity)
    .slice(0, 3);

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

          <MarketplaceFilters
            query={params.q ?? ""}
            category={params.category ?? ""}
            minimumReward={params.minReward ?? ""}
            availableOnly={params.available === "1"}
          />
        </section>

        {featuredTasks.length > 0 && !params.q && !params.category ? (
          <section className="mt-10" aria-labelledby="featured-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2
                  id="featured-heading"
                  className="text-[24px] leading-[27px] font-medium"
                >
                  Featured tasks
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  High-signal opportunities with open capacity.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {featuredTasks.map((task) => (
                <TaskCard key={task.id} task={task} featured />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12" aria-labelledby="all-tasks-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="all-tasks-heading"
                className="text-[24px] leading-[27px] font-medium"
              >
                {params.q || params.category ? "Matching tasks" : "All tasks"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {tasks.length} funded {tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
          </div>

          {tasks.length > 0 ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
              <h3 className="text-[20px] leading-[23px] font-medium">
                No tasks match these filters
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Clear a filter or lower the minimum reward to see more funded
                work.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Clear filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </ProductShell>
  );
}
