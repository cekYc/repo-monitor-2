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

// File extension to language mapping (GitHub Linguist-compatible)
const EXT_TO_LANGUAGE: Record<string, string> = {
  // JavaScript / TypeScript
  ".js": "JavaScript", ".jsx": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
  ".ts": "TypeScript", ".tsx": "TypeScript", ".mts": "TypeScript", ".cts": "TypeScript",
  // Python
  ".py": "Python", ".pyw": "Python", ".pyi": "Python",
  // Java / JVM
  ".java": "Java", ".kt": "Kotlin", ".kts": "Kotlin", ".scala": "Scala", ".clj": "Clojure",
  // C family
  ".c": "C", ".h": "C", ".cpp": "C++", ".cc": "C++", ".cxx": "C++", ".hpp": "C++", ".hxx": "C++",
  ".cs": "C#", ".m": "Objective-C", ".mm": "Objective-C",
  // Go / Rust / Zig
  ".go": "Go", ".rs": "Rust", ".zig": "Zig",
  // Web
  ".html": "HTML", ".htm": "HTML", ".css": "CSS", ".scss": "SCSS", ".sass": "SCSS", ".less": "CSS",
  ".vue": "Vue", ".svelte": "Svelte",
  // Ruby / PHP / Perl
  ".rb": "Ruby", ".php": "PHP", ".pl": "Perl", ".pm": "Perl",
  // Swift / Dart
  ".swift": "Swift", ".dart": "Dart",
  // Shell
  ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell", ".fish": "Shell",
  ".ps1": "PowerShell", ".psm1": "PowerShell",
  // Others
  ".r": "R", ".R": "R", ".lua": "Lua", ".ex": "Elixir", ".exs": "Elixir",
  ".erl": "Erlang", ".hs": "Haskell", ".ml": "OCaml", ".fs": "F#", ".fsx": "F#",
  ".jl": "Julia", ".nim": "Nim", ".v": "V", ".cr": "Crystal",
  // Data / Config
  ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".toml": "TOML", ".xml": "XML",
  ".sql": "SQL", ".graphql": "GraphQL", ".gql": "GraphQL",
  // Markup / Docs
  ".md": "Markdown", ".mdx": "Markdown", ".rst": "reStructuredText", ".tex": "TeX",
  // DevOps
  ".dockerfile": "Dockerfile", ".tf": "HCL", ".hcl": "HCL",
  // Assembly
  ".asm": "Assembly", ".s": "Assembly",
  // Jupyter
  ".ipynb": "Jupyter Notebook",
  // Makefile etc
  ".cmake": "CMake",
};

// Special filenames
const FILENAME_TO_LANGUAGE: Record<string, string> = {
  "Dockerfile": "Dockerfile",
  "Makefile": "Makefile",
  "CMakeLists.txt": "CMake",
  "Gemfile": "Ruby",
  "Rakefile": "Ruby",
  "Vagrantfile": "Ruby",
};

export function getLanguageFromPath(path: string): string | null {
  // Check filename first
  const filename = path.split("/").pop() || "";
  if (FILENAME_TO_LANGUAGE[filename]) return FILENAME_TO_LANGUAGE[filename];
  // Check extension
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const ext = filename.substring(dotIdx).toLowerCase();
  return EXT_TO_LANGUAGE[ext] || null;
}
