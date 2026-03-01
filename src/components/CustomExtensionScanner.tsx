"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes } from "@/lib/utils";

interface CustomExtension {
  ext: string;
  lang: string;
  color: string;
}

interface ExtensionResult {
  extension: string;
  language: string;
  color: string;
  files: { repo: string; path: string }[];
  totalFiles: number;
  totalBytes: number;
}

interface ScanResult {
  username: string;
  extensions: ExtensionResult[];
  totalFilesFound: number;
}

interface CustomExtensionScannerProps {
  username: string;
  token: string;
}

const STORAGE_KEY = "repo-monitor-custom-extensions";

function loadSavedExtensions(): CustomExtension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExtensions(exts: CustomExtension[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exts));
  } catch {/* ignore */}
}

export default function CustomExtensionScanner({ username, token }: CustomExtensionScannerProps) {
  const { t } = useLocale();
  const [extensions, setExtensions] = useState<CustomExtension[]>([]);
  const [newExt, setNewExt] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newColor, setNewColor] = useState("#ff6b35");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedExt, setExpandedExt] = useState<string | null>(null);

  // Load saved extensions on mount
  useEffect(() => {
    setExtensions(loadSavedExtensions());
  }, []);

  const addExtension = useCallback(() => {
    if (!newExt.trim() || !newLang.trim()) return;
    const ext = newExt.startsWith(".") ? newExt.trim() : `.${newExt.trim()}`;
    // Prevent duplicates
    if (extensions.some((e) => e.ext.toLowerCase() === ext.toLowerCase())) return;
    const updated = [...extensions, { ext, lang: newLang.trim(), color: newColor }];
    setExtensions(updated);
    saveExtensions(updated);
    setNewExt("");
    setNewLang("");
    setNewColor("#ff6b35");
  }, [newExt, newLang, newColor, extensions]);

  const removeExtension = useCallback(
    (ext: string) => {
      const updated = extensions.filter((e) => e.ext !== ext);
      setExtensions(updated);
      saveExtensions(updated);
    },
    [extensions]
  );

  const handleScan = useCallback(async () => {
    if (extensions.length === 0) return;
    setScanning(true);
    setError(null);
    setResults(null);

    try {
      const params = new URLSearchParams({
        username,
        extensions: JSON.stringify(extensions),
      });
      if (token) params.set("token", token);

      const res = await fetch(`/api/scan-extensions?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error");
      }
      const data: ScanResult = await res.json();
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setScanning(false);
    }
  }, [username, token, extensions]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {t("extensions.title")}
          </span>
          {extensions.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {extensions.map((e) => e.ext).join(", ")}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800">
          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {t("extensions.description")}
          </p>

          {/* Add Extension Form */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-24">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                Extension
              </label>
              <input
                type="text"
                value={newExt}
                onChange={(e) => setNewExt(e.target.value)}
                placeholder={t("extensions.extPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-28">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                Language
              </label>
              <input
                type="text"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                placeholder={t("extensions.langPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                Color
              </label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
            </div>
            <button
              onClick={addExtension}
              disabled={!newExt.trim() || !newLang.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {t("extensions.addExt")}
            </button>
          </div>

          {/* Extension List */}
          {extensions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extensions.map((ext) => (
                <div
                  key={ext.ext}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ext.color }}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {ext.ext}
                  </span>
                  <span className="text-xs text-gray-500">→ {ext.lang}</span>
                  <button
                    onClick={() => removeExtension(ext.ext)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title={t("extensions.remove")}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Scan Button */}
          {extensions.length > 0 && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-2.5 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 cursor-pointer"
            >
              {scanning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("extensions.scanning")}
                </span>
              ) : (
                `🔍 ${t("extensions.scan")}`
              )}
            </button>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("extensions.results")} ({results.totalFilesFound} {t("extensions.files")})
              </h3>

              {results.extensions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-3">
                  {t("extensions.noResults")}
                </p>
              )}

              {results.extensions.map((ext) => (
                <div
                  key={ext.extension}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedExt(expandedExt === ext.extension ? null : ext.extension)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: ext.color }}
                      />
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ext.extension}
                      </span>
                      <span className="text-xs text-gray-500">→ {ext.language}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {ext.totalFiles} {t("extensions.files")}
                      </span>
                      <span>{formatBytes(ext.totalBytes)}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedExt === ext.extension ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expandedExt === ext.extension && ext.files.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 max-h-48 overflow-y-auto">
                      {ext.files.map((f, i) => (
                        <div
                          key={i}
                          className="py-1 flex items-center gap-2 text-xs"
                        >
                          <span className="text-gray-400 font-mono">{f.repo}/</span>
                          <span className="text-gray-600 dark:text-gray-300 font-mono truncate">
                            {f.path}
                          </span>
                        </div>
                      ))}
                      {ext.totalFiles > ext.files.length && (
                        <p className="text-xs text-gray-400 py-1">
                          +{ext.totalFiles - ext.files.length} more...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">❌ {error}</p>
          )}
        </div>
      )}
    </div>
  );
}
