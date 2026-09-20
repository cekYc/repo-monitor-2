"use client";

import { useState, type ReactNode } from "react";
import Segmented from "@/components/ui/Segmented";
import Collapsible from "@/components/ui/Collapsible";
import InsightsPanel from "@/components/analyze/InsightsPanel";
import OrgPanel from "@/components/analyze/OrgPanel";
import BadgeGenerator from "@/components/BadgeGenerator";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import CustomExtensionScanner from "@/components/CustomExtensionScanner";
import DeveloperPersona from "@/components/DeveloperPersona";
import HealthScore from "@/components/HealthScore";
import ProfileVisibility from "@/components/ProfileVisibility";
import ProjectLeaderboard from "@/components/ProjectLeaderboard";
import RepoSuggestions from "@/components/RepoSuggestions";
import RepoTimeline from "@/components/RepoTimeline";
import { useLocale } from "@/components/LocaleProvider";
import type { UserAnalysis } from "@/lib/github";

type TabId = "activity" | "quality" | "persona" | "insights" | "tools";

/** Level 5: everything that is not part of the headline read.
 *
 *  Heatmap, health, persona and the tooling all sit behind one tab strip, and
 *  a tab's modules only mount once it has been opened — so this whole block
 *  costs nothing until asked for. Once opened, a tab stays mounted so its data
 *  survives switching back and forth. */
export default function SecondaryPanels({
  analysis,
  token,
}: {
  analysis: UserAnalysis;
  token: string;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<TabId>("activity");
  const [visited, setVisited] = useState<Set<TabId>>(new Set(["activity"]));
  const login = analysis.user.login;

  const open = (id: TabId) => {
    setTab(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "activity", label: t("panels.activity") },
    { id: "quality", label: t("panels.quality") },
    { id: "persona", label: t("panels.persona") },
    { id: "insights", label: t("panels.insights") },
    { id: "tools", label: t("panels.tools") },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-title text-fg">{t("panels.title")}</h2>
        <Segmented items={tabs} value={tab} onChange={open} />
      </div>

      <Pane id="activity" tab={tab} visited={visited}>
        <div className="space-y-3">
          <ContributionHeatmap username={login} token={token} />
          <RepoTimeline repos={analysis.repos} />
        </div>
      </Pane>

      <Pane id="quality" tab={tab} visited={visited}>
        <div className="space-y-3">
          <HealthScore username={login} token={token} />
          <ProjectLeaderboard repos={analysis.repos} />
        </div>
      </Pane>

      <Pane id="persona" tab={tab} visited={visited}>
        <DeveloperPersona username={login} token={token} />
      </Pane>

      <Pane id="insights" tab={tab} visited={visited}>
        <div className="space-y-3">
          <InsightsPanel repos={analysis.repos} />
          {analysis.analysisScope === "owner" && <ProfileVisibility analysis={analysis} />}
        </div>
      </Pane>

      <Pane id="tools" tab={tab} visited={visited}>
        <div className="space-y-3">
          <Collapsible title={t("org.title")}>
            <OrgPanel login={login} />
          </Collapsible>
          <BadgeGenerator username={login} token={token} />
          <CustomExtensionScanner username={login} token={token} />
          <RepoSuggestions
            topLanguages={analysis.overallLanguages.slice(0, 3).map((l) => l.name)}
            token={token}
          />
        </div>
      </Pane>
    </section>
  );
}

function Pane({
  id,
  tab,
  visited,
  children,
}: {
  id: TabId;
  tab: TabId;
  visited: Set<TabId>;
  children: ReactNode;
}) {
  if (!visited.has(id)) return null;
  return (
    <div role="tabpanel" hidden={tab !== id}>
      {children}
    </div>
  );
}
