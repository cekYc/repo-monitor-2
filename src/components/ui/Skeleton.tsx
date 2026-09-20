/** Loading placeholders. Rule: a loading screen shows shapes, never a blank canvas. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-1/2" : i % 2 ? "w-5/6" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-4 ${className}`}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-16 mt-3" />
    </div>
  );
}
