// Consistent color palette for programming languages
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  R: "#198CE7",
  Perl: "#0298c3",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Erlang: "#B83998",
  "Objective-C": "#438eff",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  PowerShell: "#012456",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  Zig: "#ec915c",
  Assembly: "#6E4C13",
  Vim: "#019833",
  Nix: "#7e7eff",
};

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#2563eb", "#7c3aed", "#c026d3",
];

export function getLanguageColor(language: string, index: number = 0): string {
  return LANGUAGE_COLORS[language] || CHART_COLORS[index % CHART_COLORS.length];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
