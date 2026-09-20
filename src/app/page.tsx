import { Suspense } from "react";
import AnalyzeScreen from "@/components/analyze/AnalyzeScreen";
import AnalyzeSkeleton from "@/components/analyze/AnalyzeSkeleton";

/** Analyze — the main screen. `/?user=<login>` opens straight into a result. */
export default function AnalyzePage() {
  return (
    <Suspense fallback={<AnalyzeSkeleton />}>
      <AnalyzeScreen />
    </Suspense>
  );
}
