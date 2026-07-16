import { MagnifyingGlass20 } from "@frosted-ui/icons";
import { Button, TextField } from "@whop/react/components";

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
}: {
  query: string;
  category: string;
  minimumReward: string;
  availableOnly: boolean;
}) {
  return (
    <form
      action="/"
      className="mt-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[minmax(220px,1fr)_180px_150px_auto] sm:items-center"
    >
      <TextField.Root size="3">
        <TextField.Slot>
          <MagnifyingGlass20 aria-hidden="true" />
        </TextField.Slot>
        <TextField.Input
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Search tasks"
          placeholder="Search tasks, categories, or outcomes"
        />
      </TextField.Root>

      <label className="sr-only" htmlFor="marketplace-category">
        Category
      </label>
      <select
        id="marketplace-category"
        name="category"
        defaultValue={category}
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
      >
        {categories.map((option) => (
          <option
            key={option}
            value={option === "All categories" ? "" : option}
          >
            {option}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="minimum-reward">
        Minimum reward
      </label>
      <select
        id="minimum-reward"
        name="minReward"
        defaultValue={minimumReward}
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
      >
        <option value="">Any reward</option>
        <option value="1000">$10+</option>
        <option value="2500">$25+</option>
        <option value="5000">$50+</option>
        <option value="10000">$100+</option>
      </select>

      <div className="flex items-center gap-3">
        <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-2 text-sm">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={availableOnly}
            className="size-4 accent-[var(--accent)]"
          />
          Available
        </label>
        <Button type="submit" variant="solid" color="orange" size="3">
          Apply
        </Button>
      </div>
    </form>
  );
}
