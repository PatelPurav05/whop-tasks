"use client";

import { Button } from "@whop/react/components";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { MarketplaceTask } from "@/app/marketplace-data";
import { MarketplaceFilters } from "./marketplace-filters";
import { TaskCard } from "./task-card";

type InitialFilters = {
  query: string;
  category: string;
  minimumReward: string;
  availableOnly: boolean;
};

export function MarketplaceCatalog({
  tasks,
  initialFilters,
}: {
  tasks: MarketplaceTask[];
  initialFilters: InitialFilters;
}) {
  const [query, setQuery] = useState(initialFilters.query);
  const [category, setCategory] = useState(initialFilters.category);
  const [minimumReward, setMinimumReward] = useState(
    initialFilters.minimumReward,
  );
  const [availableOnly, setAvailableOnly] = useState(
    initialFilters.availableOnly,
  );
  const deferredQuery = useDeferredValue(query);
  const shouldReduceMotion = useReducedMotion();

  const visibleTasks = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
    const minimumRewardCents = Number.parseInt(minimumReward, 10);

    return tasks.filter((task) => {
      if (category && task.category !== category) {
        return false;
      }
      if (
        Number.isFinite(minimumRewardCents) &&
        task.rewardCents < minimumRewardCents
      ) {
        return false;
      }
      if (
        availableOnly &&
        task.claimedSlots >= task.slotCapacity
      ) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return `${task.title} ${task.description} ${task.category} ${task.owner.name}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [availableOnly, category, deferredQuery, minimumReward, tasks]);

  const hasFilters =
    query.length > 0 ||
    category.length > 0 ||
    minimumReward.length > 0 ||
    availableOnly;
  const featuredTasks = hasFilters
    ? []
    : tasks
        .filter((task) => task.claimedSlots < task.slotCapacity)
        .slice(0, 3);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (minimumReward) params.set("minReward", minimumReward);
      if (availableOnly) params.set("available", "1");
      const nextUrl = params.size > 0 ? `/?${params.toString()}` : "/";
      window.history.replaceState(window.history.state, "", nextUrl);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [availableOnly, category, minimumReward, query]);

  function clearFilters(): void {
    setQuery("");
    setCategory("");
    setMinimumReward("");
    setAvailableOnly(false);
  }

  return (
    <>
      <MarketplaceFilters
        query={query}
        category={category}
        minimumReward={minimumReward}
        availableOnly={availableOnly}
        resultCount={visibleTasks.length}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onMinimumRewardChange={setMinimumReward}
        onAvailableOnlyChange={setAvailableOnly}
        onClear={clearFilters}
      />

      {featuredTasks.length > 0 ? (
        <section className="mt-10" aria-labelledby="featured-heading">
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
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {featuredTasks.map((task) => (
              <TaskCard key={task.id} task={task} featured />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="all-tasks-heading">
        <div>
          <h2
            id="all-tasks-heading"
            className="text-[24px] leading-[27px] font-medium"
          >
            {hasFilters ? "Matching tasks" : "All tasks"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Results update as you search.
          </p>
        </div>

        {visibleTasks.length > 0 ? (
          <LayoutGroup>
            <motion.div
              layout
              className="mt-5 grid gap-4 xl:grid-cols-2"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {visibleTasks.map((task) => (
                  <motion.div
                    layout
                    key={task.id}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 5, filter: "blur(2px)" }
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -3, filter: "blur(2px)" }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <TaskCard task={task} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <h3 className="text-[20px] leading-[23px] font-medium">
              No tasks match these filters
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Clear a filter or lower the minimum reward to see more funded
              work.
            </p>
            <Button
              type="button"
              onClick={clearFilters}
              variant="solid"
              color="orange"
              size="3"
              className="mt-5"
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
