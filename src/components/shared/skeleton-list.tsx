import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Bone className="h-3 w-16" />
                <Bone className="h-6 w-28" />
              </div>
              <Bone className="h-10 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {[1, 2].map((g) => (
        <div key={g}>
          <div className="flex items-center justify-between px-3 py-2">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-3 w-20" />
          </div>
          <div className="rounded-xl border bg-card divide-y">
            {Array.from({ length: g === 1 ? rows : Math.max(rows - 2, 2) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Bone className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-24" />
                  <Bone className="h-2.5 w-36" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Bone className="h-3.5 w-20 ml-auto" />
                  <Bone className="h-2.5 w-14 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Bone className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Bone className="h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Bone className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
