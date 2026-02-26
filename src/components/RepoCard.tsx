"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getLanguageColor, formatBytes, formatDate } from "@/lib/utils";
import { RepoInfo } from "@/lib/github";
import { useState } from "react";

interface RepoCardProps {
  repo: RepoInfo;
  index: number;
  isExcluded: boolean;
  onToggleExclude: (repoName: string) => void;
}

export default function RepoCard({ repo, index, isExcluded, onToggleExclude }: RepoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasLanguages = repo.languagePercentages.length > 0;
  const dominantLang = repo.languagePercentages[0];

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md border overflow-hidden hover:shadow-lg transition-all duration-300 ${
        isExcluded
          ? "border-amber-300 dark:border-amber-700 opacity-60"
          : "border-gray-200 dark:border-gray-800"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => hasLanguages && setExpanded(!expanded)}
        className={`w-full text-left p-5 transition-colors ${
          hasLanguages
            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
            : "cursor-default"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
              >
                {repo.name}
              </a>
              {dominantLang && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: getLanguageColor(dominantLang.name, 0) }}
                >
                  {dominantLang.name}
                </span>
              )}
            </div>
            {repo.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {repo.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Exclude Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExclude(repo.name);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isExcluded
                  ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400"
              }`}
              title={isExcluded ? "Genel dağılıma dahil et" : "Genel dağılımdan hariç tut"}
            >
              {isExcluded ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span title="Yıldız">⭐ {repo.stargazers_count}</span>
            <span title="Fork">🍴 {repo.forks_count}</span>
            </div>
            {hasLanguages && (
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>📦 {formatBytes(repo.totalBytes)} kod</span>
          <span>💾 {repo.size} KB repo</span>
          <span>📅 {formatDate(repo.created_at)}</span>
          <span>🔄 {formatDate(repo.updated_at)}</span>
          <span>📝 {repo.languagePercentages.length} dil</span>
        </div>

        {/* Language Bar (always visible) */}
        {hasLanguages && (
          <div className="mt-4">
            <div className="flex rounded-full overflow-hidden h-3 bg-gray-200 dark:bg-gray-700">
              {repo.languagePercentages.map((lang, i) => (
                <div
                  key={lang.name}
                  title={`${lang.name}: ${lang.value}%`}
                  className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${Math.max(lang.value, 0.3)}%`,
                    backgroundColor: getLanguageColor(lang.name, i),
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {repo.languagePercentages.slice(0, 5).map((lang, i) => (
                <div key={lang.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{
                      backgroundColor: getLanguageColor(lang.name, i),
                    }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {lang.name}
                  </span>
                  <span className="text-gray-400">%{lang.value}</span>
                </div>
              ))}
              {repo.languagePercentages.length > 5 && (
                <span className="text-xs text-indigo-500">
                  +{repo.languagePercentages.length - 5} dil daha
                </span>
              )}
            </div>
          </div>
        )}

        {!hasLanguages && (
          <div className="mt-4 text-sm text-gray-400 italic">
            Bu repoda dil bilgisi bulunamadı (boş veya binary dosyalar)
          </div>
        )}
      </button>

      {/* Expanded Detail — all repos can toggle this */}
      {expanded && hasLanguages && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-5 bg-gray-50 dark:bg-gray-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mini Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={repo.languagePercentages}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {repo.languagePercentages.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={getLanguageColor(entry.name, i)}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% (${formatBytes((props?.payload as { bytes: number })?.bytes ?? 0)})`,
                      String(name),
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* All Languages Table */}
            <div className="space-y-1.5">
              {repo.languagePercentages.map((lang, i) => (
                <div
                  key={lang.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                    style={{
                      backgroundColor: getLanguageColor(lang.name, i),
                    }}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-24 truncate">
                    {lang.name}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(lang.value, 0.5)}%`,
                        backgroundColor: getLanguageColor(lang.name, i),
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-gray-500 w-14 text-right">
                    %{lang.value}
                  </span>
                  <span className="font-mono text-xs text-gray-400 w-16 text-right">
                    {formatBytes(lang.bytes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
