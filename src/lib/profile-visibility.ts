import type { RepoInfo, UserAnalysis } from "./github";

export interface VisibilityLanguage {
  name: string;
  bytes: number;
  value: number;
}

export interface VisibilityLanguageShift {
  name: string;
  publicShare: number;
  fullShare: number;
  privateShare: number;
  delta: number;
  privateOnly: boolean;
}

export interface ProfileVisibilityMetrics {
  publicRepoCount: number;
  privateRepoCount: number;
  totalRepoCount: number;
  publicBytes: number;
  privateBytes: number;
  totalBytes: number;
  publicVisibilityRatio: number;
  privateCodeRatio: number;
  skillProfileDifference: number;
  publicLanguages: VisibilityLanguage[];
  fullLanguages: VisibilityLanguage[];
  privateLanguages: VisibilityLanguage[];
  privateOnlyLanguages: string[];
  languageShifts: VisibilityLanguageShift[];
  privateFlagships: RepoInfo[];
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function aggregateLanguages(repos: RepoInfo[]): {
  totalBytes: number;
  languages: VisibilityLanguage[];
} {
  const languageBytes = new Map<string, number>();
  let totalBytes = 0;

  for (const repo of repos) {
    for (const [name, bytes] of Object.entries(repo.languages)) {
      languageBytes.set(name, (languageBytes.get(name) ?? 0) + bytes);
      totalBytes += bytes;
    }
  }

  const languages = [...languageBytes.entries()]
    .map(([name, bytes]) => ({
      name,
      bytes,
      value: totalBytes > 0 ? roundPercent(bytes / totalBytes * 100) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return { totalBytes, languages };
}

function shareMap(languages: VisibilityLanguage[]): Map<string, number> {
  return new Map(languages.map((language) => [language.name, language.value]));
}

export function calculateProfileVisibility(
  analysis: UserAnalysis
): ProfileVisibilityMetrics {
  const publicRepos = analysis.repos.filter((repo) => !repo.private);
  const privateRepos = analysis.repos.filter((repo) => repo.private);
  const publicProfile = aggregateLanguages(publicRepos);
  const privateProfile = aggregateLanguages(privateRepos);
  const fullProfile = aggregateLanguages(analysis.repos);
  const totalBytes = fullProfile.totalBytes;
  const publicBytes = publicProfile.totalBytes;
  const privateBytes = privateProfile.totalBytes;
  const publicVisibilityRatio = totalBytes > 0
    ? roundPercent(publicBytes / totalBytes * 100)
    : privateRepos.length === 0 ? 100 : 0;
  const privateCodeRatio = roundPercent(100 - publicVisibilityRatio);

  const publicShares = shareMap(publicProfile.languages);
  const privateShares = shareMap(privateProfile.languages);
  const fullShares = shareMap(fullProfile.languages);
  const languageNames = new Set([
    ...fullShares.keys(),
    ...publicShares.keys(),
    ...privateShares.keys(),
  ]);

  const languageShifts = [...languageNames]
    .map((name) => {
      const publicShare = publicShares.get(name) ?? 0;
      const fullShare = fullShares.get(name) ?? 0;
      const privateShare = privateShares.get(name) ?? 0;
      return {
        name,
        publicShare,
        fullShare,
        privateShare,
        delta: roundPercent(fullShare - publicShare),
        privateOnly: privateShare > 0 && publicShare === 0,
      };
    })
    .filter((language) => language.privateOnly || Math.abs(language.delta) >= 0.5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const profileDistance = publicBytes === 0 && totalBytes > 0
    ? 100
    : Math.min(
        100,
        [...languageNames].reduce(
          (sum, name) => sum + Math.abs((fullShares.get(name) ?? 0) - (publicShares.get(name) ?? 0)),
          0
        ) / 2
      );

  const privateFlagships = [...privateRepos]
    .sort((a, b) => {
      const scoreDelta = (b.advancedMetrics?.projectScore ?? 0) - (a.advancedMetrics?.projectScore ?? 0);
      return scoreDelta || b.totalBytes - a.totalBytes;
    })
    .slice(0, 3);

  return {
    publicRepoCount: publicRepos.length,
    privateRepoCount: privateRepos.length,
    totalRepoCount: analysis.repos.length,
    publicBytes,
    privateBytes,
    totalBytes,
    publicVisibilityRatio,
    privateCodeRatio,
    skillProfileDifference: roundPercent(profileDistance),
    publicLanguages: publicProfile.languages,
    fullLanguages: fullProfile.languages,
    privateLanguages: privateProfile.languages,
    privateOnlyLanguages: privateProfile.languages
      .filter((language) => !publicShares.has(language.name))
      .map((language) => language.name),
    languageShifts,
    privateFlagships,
  };
}
