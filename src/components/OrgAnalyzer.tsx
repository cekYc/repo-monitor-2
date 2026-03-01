"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { OrgAnalysis } from "@/lib/github";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface OrgAnalyzerProps {
  token: string;
}

export default function OrgAnalyzer({ token }: OrgAnalyzerProps) {
  const { t } = useLocale();
  const [orgName, setOrgName] = useState("");
  const [analysis, setAnalysis] = useState<OrgAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const params = new URLSearchParams({ org: orgName.trim() });
      if (token) params.set("token", token);
      const res = await fetch(`/api/analyze-org?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error.generic"));
      setAnalysis(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  const pieData = analysis?.overallLanguages.slice(0, 15) ?? [];
  const barData =
    analysis?.overallLanguages.slice(0, 20).map((l, i) => ({
      ...l,
      fill: getLanguageColor(l.name, i),
    })) ?? [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
      >
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {t("org.title")}
        </h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("org.placeholder")}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !orgName.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "..." : t("org.submit")}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">❌ {error}</p>
          )}

          {loading && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("org.loading")}
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Org Profile Card */}
              <div className="bg-linear-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <Image
                    src={analysis.org.avatar_url}
                    alt={analysis.org.login}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl border-2 border-white/30"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{analysis.org.name || analysis.org.login}</h3>
                    <a
                      href={analysis.org.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white text-sm transition-colors"
                    >
                      @{analysis.org.login}
                    </a>
                    {analysis.org.description && (
                      <p className="text-white/90 text-sm mt-1">{analysis.org.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 mt-4">
                  <div>
                    <span className="text-2xl font-bold">{analysis.totalRepos}</span>
                    <span className="text-white/70 ml-1 text-sm">{t("org.publicRepos")}</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{formatBytes(analysis.totalBytes)}</span>
                    <span className="text-white/70 ml-1 text-sm">{t("stats.totalCode")}</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{analysis.overallLanguages.length}</span>
                    <span className="text-white/70 ml-1 text-sm">{t("stats.language")}</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {t("stats.pie.title")}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => (value > 3 ? `${name} ${value}%` : "")}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={getLanguageColor(entry.name, index)} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value}% (${formatBytes((props?.payload as { bytes: number })?.bytes ?? 0)})`,
                          String(name),
                        ]}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {t("stats.bar.title")}
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 28)}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatBytes(v)} fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value) => [formatBytes(Number(value)), ""]}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                        cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                      />
                      <Bar dataKey="bytes" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800}>
                        {barData.map((entry, index) => (
                          <Cell key={entry.name} fill={getLanguageColor(entry.name, index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
