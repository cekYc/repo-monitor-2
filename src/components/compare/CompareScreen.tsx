"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import ErrorNotice from "@/components/ui/ErrorNotice";
import UserCompare from "@/components/UserCompare";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "@/components/LocaleProvider";
import { codeFromResponse, toErrorCode, type ErrorCode } from "@/lib/errors";
import { getLastUser } from "@/lib/recent";
import { tokenHeaders } from "@/lib/token";
import type { UserAnalysis } from "@/lib/github";

/** A vs B. The action stays disabled until both sides are named — there is no
 *  half comparison to render, so the button never pretends otherwise. */
export default function CompareScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [a, setA] = useState(searchParams.get("a") ?? "");
  const [b, setB] = useState(searchParams.get("b") ?? "");
  const [userA, setUserA] = useState<UserAnalysis | null>(null);
  const [userB, setUserB] = useState<UserAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const autoRan = useRef(false);

  // Side A defaults to the last profile the visitor looked at, so the common
  // case is "compare me with someone" in one keystroke.
  useEffect(() => {
    if (!a) {
      const last = getLastUser();
      if (last) setA(last);
    }
  }, [a]);

  const fetchUser = async (login: string): Promise<UserAnalysis> => {
    const res = await fetch(`/api/analyze?username=${encodeURIComponent(login)}`, {
      headers: tokenHeaders(),
    });
    const payload = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error("compare"), {
        appCode: codeFromResponse(payload, res.status),
      });
    }
    return payload as UserAnalysis;
  };

  const run = useCallback(
    async (left: string, right: string) => {
      if (!left.trim() || !right.trim()) return;
      setLoading(true);
      setErrorCode(null);
      setUserA(null);
      setUserB(null);
      router.replace(
        `/compare?a=${encodeURIComponent(left.trim())}&b=${encodeURIComponent(right.trim())}`,
        { scroll: false }
      );
      try {
        const [ra, rb] = await Promise.all([fetchUser(left.trim()), fetchUser(right.trim())]);
        setUserA(ra);
        setUserB(rb);
      } catch (err: unknown) {
        setErrorCode((err as { appCode?: ErrorCode }).appCode ?? toErrorCode(err));
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // A shared /compare?a=…&b=… link runs itself.
  useEffect(() => {
    const qa = searchParams.get("a");
    const qb = searchParams.get("b");
    if (!autoRan.current && qa && qb) {
      autoRan.current = true;
      run(qa, qb);
    }
  }, [searchParams, run]);

  const ready = Boolean(a.trim() && b.trim());

  return (
    <div className="space-y-4">
      <div className="card p-4 md:p-5">
        <h1 className="t-title text-fg">{t("compare.pageTitle")}</h1>
        <p className="t-caption text-faint mt-0.5">{t("compare.pageHint")}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(a, b);
          }}
          className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mt-4"
        >
          <label className="min-w-0">
            <span className="sr-only">{t("compare.sideA")}</span>
            <input
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder={t("compare.sideA")}
              autoComplete="off"
              spellCheck={false}
              className="field font-mono"
            />
          </label>
          <span className="hidden sm:block t-caption text-faint text-center px-1">vs</span>
          <label className="min-w-0">
            <span className="sr-only">{t("compare.sideB")}</span>
            <input
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder={t("compare.sideB")}
              autoComplete="off"
              spellCheck={false}
              className="field font-mono"
            />
          </label>
          <button type="submit" disabled={!ready || loading} className="btn btn-primary">
            {loading ? t("compare.running") : t("compare.run")}
          </button>
        </form>

        {!ready && <p className="t-caption text-faint mt-2">{t("compare.needBoth")}</p>}
      </div>

      {errorCode && <ErrorNotice code={errorCode} onRetry={() => run(a, b)} />}

      {loading && (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      )}

      {!loading && !errorCode && !userA && (
        <EmptyState title={t("compare.emptyTitle")} body={t("compare.emptyBody")} />
      )}

      {userA && userB && <UserCompare userA={userA} userB={userB} />}
    </div>
  );
}
