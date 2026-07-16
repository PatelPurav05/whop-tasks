"use client";

import { MagnifyingGlass20 } from "@frosted-ui/icons";
import {
  Button,
  Checkbox,
  Select,
  TextField,
} from "@whop/react/components";

const categories = [
  "All categories",
  "Community",
  "Content",
  "Product research",
  "QA",
  "Sales research",
  "User research",
];

export function MarketplaceFilters({
  query,
  category,
  minimumReward,
  availableOnly,
  resultCount,
  onQueryChange,
  onCategoryChange,
  onMinimumRewardChange,
  onAvailableOnlyChange,
  onClear,
}: {
  query: string;
  category: string;
  minimumReward: string;
  availableOnly: boolean;
  resultCount: number;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onMinimumRewardChange: (value: string) => void;
  onAvailableOnlyChange: (value: boolean) => void;
  onClear: () => void;
}) {
  const hasFilters =
    query.length > 0 ||
    category.length > 0 ||
    minimumReward.length > 0 ||
    availableOnly;

  return (
    <div
      className="mt-6 rounded-2xl bg-[var(--surface)] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.04)] ring-1 ring-black/6 dark:ring-white/10"
      role="search"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_180px_150px] sm:items-center">
        <TextField.Root size="3" className="marketplace-search-field">
          <TextField.Slot>
            <MagnifyingGlass20 aria-hidden="true" />
          </TextField.Slot>
          <TextField.Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Search tasks"
            placeholder="Search tasks, categories, or outcomes"
            autoComplete="off"
          />
        </TextField.Root>

        <Select.Root
          value={category || "all"}
          onValueChange={(value) =>
            onCategoryChange(value === "all" ? "" : value)
          }
        >
          <Select.Trigger
            className="w-full"
            aria-label="Filter by category"
          />
          <Select.Content>
            {categories.map((option) => (
              <Select.Item
                key={option}
                value={option === "All categories" ? "all" : option}
              >
                {option}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root
          value={minimumReward || "any"}
          onValueChange={(value) =>
            onMinimumRewardChange(value === "any" ? "" : value)
          }
        >
          <Select.Trigger
            className="w-full"
            aria-label="Filter by minimum reward"
          />
          <Select.Content>
            <Select.Item value="any">Any reward</Select.Item>
            <Select.Item value="1000">$10+</Select.Item>
            <Select.Item value="2500">$25+</Select.Item>
            <Select.Item value="5000">$50+</Select.Item>
            <Select.Item value="10000">$100+</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-1 pt-2">
        <label className="flex min-h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-2 text-sm hover:bg-[var(--surface-subtle)]">
          <Checkbox
            checked={availableOnly}
            onCheckedChange={(checked) => onAvailableOnlyChange(checked === true)}
          />
          Open slots only
        </label>
        <p
          className="ml-auto px-2 text-sm text-[var(--muted)]"
          aria-live="polite"
        >
          {resultCount} {resultCount === 1 ? "task" : "tasks"}
        </p>
        {hasFilters ? (
          <Button
            type="button"
            onClick={onClear}
            variant="ghost"
            color="orange"
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
