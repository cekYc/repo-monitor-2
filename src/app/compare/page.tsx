import { Suspense } from "react";
import CompareScreen from "@/components/compare/CompareScreen";
import { Skeleton } from "@/components/ui/Skeleton";

/** Compare — A vs B. `/compare?a=…&b=…` is shareable and runs itself. */
export default function ComparePage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
      <CompareScreen />
    </Suspense>
  );
}
