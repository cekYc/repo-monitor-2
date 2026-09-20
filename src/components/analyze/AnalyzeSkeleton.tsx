import { Skeleton } from "@/components/ui/Skeleton";

/** Loading shape of the Analyze screen: same blocks, same rhythm, no content.
 *  A visitor always sees the layout they are about to get. */
export default function AnalyzeSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {/* Profile summary */}
      <div className="card p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex items-start gap-3.5 md:w-[46%]">
            <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full max-w-xs" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
            <Skeleton className="h-3 w-full rounded-pill" />
          </div>
        </div>
      </div>

      {/* Language DNA */}
      <div className="card p-4 md:p-5">
        <Skeleton className="h-4 w-36" />
        <div className="grid lg:grid-cols-2 gap-5 mt-4">
          <Skeleton className="h-[200px] rounded-lg" />
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-20 mt-3" />
          </div>
        ))}
      </div>

      {/* Repo grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-pill" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
