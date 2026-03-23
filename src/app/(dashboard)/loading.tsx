export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse h-8 w-40 rounded-md bg-muted" />
        <div className="animate-pulse h-8 w-28 rounded-lg bg-muted" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl ring-1 ring-foreground/10 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="animate-pulse h-3 w-16 rounded bg-muted" />
                <div className="animate-pulse h-6 w-28 rounded bg-muted" />
              </div>
              <div className="animate-pulse h-10 w-10 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl ring-1 ring-foreground/10 bg-card p-4">
            <div className="animate-pulse h-4 w-40 rounded bg-muted mb-4" />
            <div className="animate-pulse h-[200px] w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
