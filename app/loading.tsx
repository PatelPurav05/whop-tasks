import { Skeleton } from "@whop/react/components";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="h-16 border-b border-[var(--border)] bg-[var(--surface)]" />
      <main className="mx-auto w-full max-w-[1080px] px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton.Text size="4" className="w-36" />
        <Skeleton.Text size="8" className="mt-3 max-w-xl" />
        <Skeleton.Text size="4" className="mt-3 max-w-2xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton.Rect
              key={index}
              className="h-56 rounded-2xl"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
