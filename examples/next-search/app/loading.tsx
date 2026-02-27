export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Search bar skeleton */}
      <div className="h-10 w-full animate-pulse rounded bg-gray-800" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
        ))}
        <div className="h-8 w-24 animate-pulse rounded bg-gray-800" />
        <div className="h-8 w-24 animate-pulse rounded bg-gray-800" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="h-[340px] w-full animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-800" />
            <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
