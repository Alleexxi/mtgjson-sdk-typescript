export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="h-[468px] w-[336px] shrink-0 animate-pulse rounded-lg bg-gray-800" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-800" />
          <div className="h-32 w-full animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-gray-800" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
