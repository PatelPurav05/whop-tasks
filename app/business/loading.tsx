import { Skeleton } from "@whop/react/components";

export default function BusinessLoading() {
  return (
    <main
      className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Loading business workspace"
    >
      <Skeleton.Rect className="h-4 w-28" />
      <Skeleton.Rect className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton.Rect className="mt-4 h-5 w-[520px] max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-5 border-y border-black/10 py-6 dark:border-white/12 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton.Rect className="h-3 w-20" />
            <Skeleton.Rect className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-10 space-y-4">
        <Skeleton.Rect className="h-7 w-44" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton.Rect key={index} className="h-20 w-full" />
        ))}
      </div>
    </main>
  );
}
