"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface BadgeGeneratorProps {
  username: string;
  token?: string;
}

export default function BadgeGenerator({ username, token }: BadgeGeneratorProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ceky-repo-monitor.vercel.app";
  // Preview URL uses token for auth (avoids rate limit), but embed code doesn't include token
  const badgePreviewUrl = token
    ? `${baseUrl}/api/badge/${username}?token=${encodeURIComponent(token)}`
    : `${baseUrl}/api/badge/${username}`;
  const badgeShareUrl = `${baseUrl}/api/badge/${username}`;
  const profileUrl = `${baseUrl}/?user=${username}`;

  const markdownCode = `[![${username}'s Languages](${badgeShareUrl})](${profileUrl})`;
  const htmlCode = `<a href="${profileUrl}"><img src="${badgeShareUrl}" alt="${username}'s Languages" /></a>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        {t("badge.title")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {t("badge.description")}
      </p>

      {/* Preview */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
          {t("badge.preview")}
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-800 overflow-x-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgePreviewUrl} alt={`${username}'s Languages`} className="max-w-full" />
        </div>
      </div>

      {/* Markdown */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t("badge.markdown")}
          </h3>
          <button
            onClick={() => handleCopy(markdownCode, "md")}
            className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer transition-colors"
          >
            {copied === "md" ? `✓ ${t("badge.copied")}` : t("badge.copy")}
          </button>
        </div>
        <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto border border-gray-100 dark:border-gray-700 select-all">
          {markdownCode}
        </pre>
      </div>

      {/* HTML */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t("badge.html")}
          </h3>
          <button
            onClick={() => handleCopy(htmlCode, "html")}
            className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer transition-colors"
          >
            {copied === "html" ? `✓ ${t("badge.copied")}` : t("badge.copy")}
          </button>
        </div>
        <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto border border-gray-100 dark:border-gray-700 select-all">
          {htmlCode}
        </pre>
      </div>
    </div>
  );
}
