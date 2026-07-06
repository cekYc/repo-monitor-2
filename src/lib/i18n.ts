export type Locale = "tr" | "en";

export const translations = {
  // Header
  "header.title": { tr: "Ceky's Repo Monitor", en: "Ceky's Repo Monitor" },
  "header.subtitle": {
    tr: "GitHub kullanıcılarının repolarını ve dil dağılımlarını analiz edin",
    en: "Analyze GitHub users' repositories and language distributions",
  },

  // SearchForm
  "search.title": { tr: "GitHub kullanıcı analizi", en: "GitHub user analysis" },
  "search.token.label": { tr: "GitHub API Token", en: "GitHub API Token" },
  "search.token.optional": { tr: "Opsiyonel", en: "Optional" },
  "search.token.saved": { tr: "✓ Token tarayıcıda kayıtlı — saatte 5.000 istek", en: "✓ Token saved in browser — 5,000 requests/hour" },
  "search.token.warning": { tr: "⚠ Tokensiz saatte sadece 60 istek hakkınız var. Token ile 5.000'e çıkar.", en: "⚠ Without token: only 60 requests/hour. With token: 5,000." },
  "search.token.delete": { tr: "Token'ı sil", en: "Delete token" },
  "search.username.label": { tr: "GitHub Kullanıcı Adı", en: "GitHub Username" },
  "search.username.placeholder": { tr: "örn: cekYc", en: "e.g. cekYc" },
  "search.submit": { tr: "Analiz Et", en: "Analyze" },
  "search.loading": { tr: "Analiz ediliyor...", en: "Analyzing..." },
  "search.recent": { tr: "Son Aramalar", en: "Recent Searches" },

  // Compare
  "search.compare.label": { tr: "Karşılaştırılacak Kullanıcı", en: "User to Compare" },
  "search.compare.placeholder": { tr: "örn: torvalds", en: "e.g. torvalds" },
  "search.compare.button": { tr: "Karşılaştır", en: "Compare" },
  "search.compare.cancel": { tr: "Karşılaştırmayı Kapat", en: "Close Comparison" },
  "search.compare.toggle": { tr: "👥 Karşılaştır", en: "👥 Compare" },

  // Progress
  "progress.analyzing": { tr: "Analiz ediliyor...", en: "Analyzing..." },
  "progress.loading": { tr: "Repolar yükleniyor...", en: "Loading repos..." },

  // Cache
  "cache.loaded": { tr: "Cache'den yüklendi · 30 dk geçerli", en: "Loaded from cache · valid 30 min" },
  "cache.refresh": { tr: "Yenile", en: "Refresh" },

  // OverallStats
  "stats.repo": { tr: "Repo", en: "Repos" },
  "stats.followers": { tr: "Takipçi", en: "Followers" },
  "stats.following": { tr: "Takip", en: "Following" },
  "stats.totalCode": { tr: "Toplam Kod", en: "Total Code" },
  "stats.language": { tr: "Dil", en: "Lang" },
  "stats.distribution.title": { tr: "Genel dil dağılımı", en: "Overall language distribution" },
  "stats.pie.title": { tr: "Yüzdelik Dağılım", en: "Percentage Distribution" },
  "stats.bar.title": { tr: "Boyut Karşılaştırması", en: "Size Comparison" },
  "stats.table.title": { tr: "Detaylı Tablo", en: "Detailed Table" },
  "stats.table.lang": { tr: "Dil", en: "Language" },
  "stats.table.percent": { tr: "Yüzde", en: "Percent" },
  "stats.table.size": { tr: "Boyut", en: "Size" },
  "stats.table.ratio": { tr: "Oran", en: "Ratio" },
  "stats.export": { tr: "PNG indir", en: "Download PNG" },
  "stats.exporting": { tr: "Hazırlanıyor...", en: "Preparing..." },

  // Exclusion
  "exclusion.banner": { tr: "repo genel dağılımdan hariç tutuluyor", en: "repos excluded from overall distribution" },
  "exclusion.active": { tr: "aktif", en: "active" },
  "exclusion.includeAll": { tr: "Tümünü Dahil Et", en: "Include All" },

  // Insights
  "insights.title": { tr: "Öne çıkan metrikler", en: "Key insights" },
  "insights.favLang": { tr: "Favori Dil", en: "Favorite Language" },
  "insights.favLangDetail": { tr: "repoda birincil dil", en: "repos as primary language" },
  "insights.avgLang": { tr: "Ortalama Dil / Repo", en: "Avg Language / Repo" },
  "insights.avgLangDetail": { tr: "dil ortalaması", en: "language average" },
  "insights.avgSize": { tr: "Ortalama Repo Boyutu", en: "Average Repo Size" },
  "insights.codeSize": { tr: "kod boyutu", en: "code size" },
  "insights.totalStars": { tr: "Toplam Yıldız", en: "Total Stars" },
  "insights.mostStarred": { tr: "En çok", en: "Most" },
  "insights.totalForks": { tr: "Toplam Fork", en: "Total Forks" },
  "insights.noFork": { tr: "Henüz fork yok", en: "No forks yet" },
  "insights.biggestRepo": { tr: "En Büyük Repo", en: "Biggest Repo" },
  "insights.mostLangs": { tr: "En Çok Dil", en: "Most Languages" },
  "insights.differentLangs": { tr: "farklı dil", en: "different languages" },
  "insights.newestRepo": { tr: "En Yeni Repo", en: "Newest Repo" },
  "insights.oldestRepo": { tr: "En Eski Repo", en: "Oldest Repo" },
  "insights.lastUpdated": { tr: "Son Güncellenen", en: "Last Updated" },
  "insights.totalLangs": { tr: "Toplam Dil Sayısı", en: "Total Languages" },
  "insights.differentProgLangs": { tr: "farklı programlama dili", en: "different programming languages" },
  "insights.smallestRepo": { tr: "En Küçük Repo", en: "Smallest Repo" },

  // Repo List
  "repos.title": { tr: "📁 Repolar", en: "📁 Repositories" },
  "repos.allLangs": { tr: "Tüm Diller", en: "All Languages" },
  "repos.sort.updated": { tr: "Son Güncelleme", en: "Last Updated" },
  "repos.sort.stars": { tr: "Yıldız Sayısı", en: "Star Count" },
  "repos.sort.size": { tr: "Kod Boyutu", en: "Code Size" },
  "repos.sort.languages": { tr: "Dil Sayısı", en: "Language Count" },
  "repos.sort.name": { tr: "İsim (A-Z)", en: "Name (A-Z)" },
  "repos.sort.nameDesc": { tr: "İsim (Z-A)", en: "Name (Z-A)" },
  "repos.sort.created": { tr: "Oluşturulma Tarihi", en: "Created Date" },
  "repos.sort.forks": { tr: "Fork Sayısı", en: "Fork Count" },
  "repos.notFound": { tr: "Repo bulunamadı", en: "No repos found" },
  "repos.langNotFound": { tr: "dili kullanılan repo bulunamadı", en: "language — no repos found" },

  // RepoCard
  "repo.code": { tr: "kod", en: "code" },
  "repo.repo": { tr: "repo", en: "repo" },
  "repo.langs": { tr: "dil", en: "langs" },
  "repo.moreLangs": { tr: "dil daha", en: "more languages" },
  "repo.noLangs": { tr: "Bu repoda dil bilgisi bulunamadı (boş veya binary dosyalar)", en: "No language data found in this repo (empty or binary files)" },
  "repo.exclude": { tr: "Genel dağılımdan hariç tut", en: "Exclude from distribution" },
  "repo.include": { tr: "Genel dağılıma dahil et", en: "Include in distribution" },
  "repo.commitHistory.load": { tr: "Commit Geçmişini Göster", en: "Show Commit History" },
  "repo.commitHistory.hide": { tr: "Commit Geçmişini Gizle", en: "Hide Commit History" },
  "repo.commitHistory.loading": { tr: "Commit geçmişi yükleniyor...", en: "Loading commit history..." },

  // CommitHistory
  "commit.timeline": { tr: "Dil Dağılımı Zaman Çizelgesi", en: "Language Distribution Timeline" },
  "commit.commit": { tr: "commit", en: "commits" },
  "commit.notEnough": { tr: "Yeterli commit geçmişi bulunamadı (en az 2 commit gerekli)", en: "Not enough commit history (at least 2 commits required)" },
  "commit.changes": { tr: "İlk → Son Commit Değişimleri", en: "First → Last Commit Changes" },
  "commit.total": { tr: "Toplam", en: "Total" },

  // Rate Limit
  "rateLimit.label": { tr: "API Limiti", en: "API Limit" },
  "rateLimit.remaining": { tr: "kalan", en: "remaining" },
  "rateLimit.reset": { tr: "Yenilenme", en: "Reset" },
  "rateLimit.warning": { tr: "API limiti azalıyor! Token ekleyerek artırabilirsiniz.", en: "API limit running low! Add a token to increase." },

  // Compare
  "compare.title": { tr: "👥 Kullanıcı Karşılaştırması", en: "👥 User Comparison" },
  "compare.sharedLangs": { tr: "Ortak Diller", en: "Shared Languages" },
  "compare.uniqueLangs": { tr: "Özgün Diller", en: "Unique Languages" },
  "compare.totalCode": { tr: "Toplam Kod", en: "Total Code" },
  "compare.totalRepos": { tr: "Toplam Repo", en: "Total Repos" },
  "compare.totalStars": { tr: "Toplam Yıldız", en: "Total Stars" },
  "compare.langDistribution": { tr: "Dil Dağılımı Karşılaştırması", en: "Language Distribution Comparison" },

  // Theme
  "theme.dark": { tr: "Karanlık Moda Geç", en: "Switch to Dark Mode" },
  "theme.light": { tr: "Aydınlık Moda Geç", en: "Switch to Light Mode" },

  // Error
  "error.generic": { tr: "Bir hata oluştu", en: "An error occurred" },
  "error.notFound": { tr: "kullanıcısı bulunamadı", en: "user not found" },
  "error.badToken": { tr: "Geçersiz GitHub API token", en: "Invalid GitHub API token" },
  "error.rateLimit": { tr: "API istek limiti aşıldı. Token kullanarak limiti artırabilirsiniz.", en: "API rate limit exceeded. Add a token to increase the limit." },

  // Footer
  "footer.copyright": { tr: "Repo Monitor © 2026", en: "Repo Monitor © 2026" },

  // Organization Analysis
  "org.toggle": { tr: "Organizasyon analizi", en: "Organization analysis" },
  "org.title": { tr: "Organizasyon analizi", en: "Organization analysis" },
  "org.placeholder": { tr: "örn: facebook", en: "e.g. facebook" },
  "org.label": { tr: "Organizasyon Adı", en: "Organization Name" },
  "org.submit": { tr: "Analiz Et", en: "Analyze" },
  "org.loading": { tr: "Org repoları analiz ediliyor...", en: "Analyzing org repos..." },
  "org.members": { tr: "Üye", en: "Members" },
  "org.publicRepos": { tr: "Repo", en: "Repos" },

  // Badge Generator
  "badge.title": { tr: "Gömülebilir rozet", en: "Embeddable badge" },
  "badge.description": { tr: "GitHub README'nize ekleyebileceğiniz dil dağılımı badge'i", en: "Language distribution badge for your GitHub README" },
  "badge.markdown": { tr: "Markdown", en: "Markdown" },
  "badge.html": { tr: "HTML", en: "HTML" },
  "badge.copied": { tr: "Kopyalandı!", en: "Copied!" },
  "badge.copy": { tr: "Kopyala", en: "Copy" },
  "badge.preview": { tr: "Önizleme", en: "Preview" },

  // Suggestions
  "suggestions.title": { tr: "Önerilen repolar", en: "Suggested repos" },
  "suggestions.description": { tr: "En çok kullandığınız dillere göre popüler repolar", en: "Popular repos based on your most-used languages" },
  "suggestions.loading": { tr: "Öneriler yükleniyor...", en: "Loading suggestions..." },
  "suggestions.star": { tr: "yıldız", en: "stars" },
  "suggestions.empty": { tr: "Öneri bulunamadı", en: "No suggestions found" },

  // Contribution Heatmap
  "heatmap.title": { tr: "Katkı haritası", en: "Contribution heatmap" },
  "heatmap.loading": { tr: "Katkı verileri yükleniyor...", en: "Loading contribution data..." },
  "heatmap.events": { tr: "katkı", en: "contributions" },
  "heatmap.noData": { tr: "Katkı verisi bulunamadı", en: "No contribution data found" },
  "heatmap.less": { tr: "Az", en: "Less" },
  "heatmap.more": { tr: "Çok", en: "More" },
  "heatmap.eventsOnly": { tr: "~90 gün (token ile tam veri)", en: "~90 days (full data with token)" },
  "heatmap.eventsNote": { tr: "GitHub Events API sadece son ~90 günü döner. Token ekleyerek tam 365 günlük veri alabilirsiniz.", en: "GitHub Events API only returns the last ~90 days. Add a token to get full 365-day data." },

  // Repo Export
  "repos.export.button": { tr: "📸 Seçilenleri PNG İndir", en: "📸 Export Selected as PNG" },
  "repos.export.selectAll": { tr: "Tümünü Seç", en: "Select All" },
  "repos.export.deselectAll": { tr: "Seçimi Temizle", en: "Deselect All" },
  "repos.export.selected": { tr: "seçili", en: "selected" },
  "repos.export.exporting": { tr: "PNG oluşturuluyor...", en: "Generating PNG..." },

  // Compare Enhancements
  "compare.activity": { tr: "Aktivite", en: "Activity" },
  "compare.avgRepoSize": { tr: "Ort. Repo Boyutu", en: "Avg Repo Size" },
  "compare.topLang": { tr: "En Çok Dil", en: "Top Language" },
  "compare.forks": { tr: "Toplam Fork", en: "Total Forks" },
  "compare.languageCount": { tr: "Dil Sayısı", en: "Language Count" },
  "compare.codePerRepo": { tr: "Repo Başına Kod", en: "Code per Repo" },
  "compare.winner": { tr: "Kazanan", en: "Winner" },
  "compare.tie": { tr: "Berabere", en: "Tie" },
  "compare.exportPng": { tr: "📸 Karşılaştırmayı PNG İndir", en: "📸 Export Comparison as PNG" },

  // PWA
  "pwa.install": { tr: "Uygulamayı Yükle", en: "Install App" },
  "pwa.installed": { tr: "Uygulama yüklendi!", en: "App installed!" },

  // Health Score
  "health.title": { tr: "Repo sağlık & güvenlik skoru", en: "Repo health & security score" },
  "health.loading": { tr: "Sağlık verileri analiz ediliyor...", en: "Analyzing health data..." },
  "health.overall": { tr: "Genel Skor", en: "Overall Score" },
  "health.hasReadme": { tr: "README mevcut", en: "Has README" },
  "health.hasLicense": { tr: "Lisans mevcut", en: "Has License" },
  "health.hasDescription": { tr: "Açıklama mevcut", en: "Has Description" },
  "health.hasCI": { tr: "CI/CD yapılandırması", en: "CI/CD Configuration" },
  "health.recentUpdate": { tr: "Son 90 günde güncellendi", en: "Updated in last 90 days" },
  "health.lowIssues": { tr: "Düşük açık issue oranı", en: "Low open issue ratio" },
  "health.excellent": { tr: "Mükemmel", en: "Excellent" },
  "health.good": { tr: "İyi", en: "Good" },
  "health.fair": { tr: "Orta", en: "Fair" },
  "health.poor": { tr: "Zayıf", en: "Poor" },
  "health.repoBreakdown": { tr: "Repo Bazlı Dağılım", en: "Per-Repo Breakdown" },
  "health.noData": { tr: "Sağlık verisi bulunamadı", en: "No health data found" },
  "health.tip": { tr: "İpucu: README, LICENSE ve CI ekleyin", en: "Tip: Add README, LICENSE and CI" },

  // Developer Persona
  "persona.title": { tr: "Geliştirici personası", en: "Developer persona" },
  "persona.loading": { tr: "Persona analiz ediliyor...", en: "Analyzing persona..." },
  "persona.noData": { tr: "Yeterli veri bulunamadı", en: "Not enough data found" },
  "persona.commitHours": { tr: "Commit Saat Dağılımı", en: "Commit Hour Distribution" },
  "persona.badges": { tr: "Rozetler", en: "Badges" },
  "persona.nightOwl": { tr: "Gece Kuşu", en: "Night Owl" },
  "persona.nightOwlDesc": { tr: "Gece 00:00-05:00 arası aktif", en: "Active between 00:00-05:00" },
  "persona.earlyBird": { tr: "Erken Kalkan", en: "Early Bird" },
  "persona.earlyBirdDesc": { tr: "Sabah 05:00-09:00 arası aktif", en: "Active between 05:00-09:00" },
  "persona.weekendWarrior": { tr: "Hafta Sonu Savaşçısı", en: "Weekend Warrior" },
  "persona.weekendWarriorDesc": { tr: "Hafta sonları açık kaynak çalışıyor", en: "Works on open source on weekends" },
  "persona.polyglot": { tr: "Poliglot", en: "Polyglot" },
  "persona.polyglotDesc": { tr: "10+ farklı dil kullanıyor", en: "Uses 10+ different languages" },
  "persona.streaker": { tr: "Seri Yapıcı", en: "Streaker" },
  "persona.streakerDesc": { tr: "Üst üste birçok gün aktif", en: "Active for many consecutive days" },
  "persona.refactorMaster": { tr: "Refactor Ustası", en: "Refactor Master" },
  "persona.refactorMasterDesc": { tr: "Eklemekten çok kod temizliği", en: "More cleanup than additions" },
  "persona.productivePeak": { tr: "En Verimli Saat", en: "Most Productive Hour" },
  "persona.activeDays": { tr: "En Aktif Gün", en: "Most Active Day" },

  // Custom Extensions
  "extensions.title": { tr: "Özel uzantı tarayıcı", en: "Custom extension scanner" },
  "extensions.description": { tr: "GitHub Linguist'in tanımadığı özel dosya uzantılarını analiz edin", en: "Analyze custom file extensions not recognized by GitHub Linguist" },
  "extensions.addExt": { tr: "Uzantı Ekle", en: "Add Extension" },
  "extensions.extPlaceholder": { tr: "örn: .cky", en: "e.g. .cky" },
  "extensions.langPlaceholder": { tr: "örn: Ceky Lang", en: "e.g. Ceky Lang" },
  "extensions.colorPlaceholder": { tr: "örn: #ff6b35", en: "e.g. #ff6b35" },
  "extensions.scan": { tr: "Tara", en: "Scan" },
  "extensions.scanning": { tr: "Taranıyor...", en: "Scanning..." },
  "extensions.results": { tr: "Tarama Sonuçları", en: "Scan Results" },
  "extensions.noResults": { tr: "Bu uzantılara sahip dosya bulunamadı", en: "No files found with these extensions" },
  "extensions.files": { tr: "dosya", en: "files" },
  "extensions.remove": { tr: "Kaldır", en: "Remove" },
  "extensions.saved": { tr: "Uzantılar kaydedildi", en: "Extensions saved" },

  // --- Navigation / Tabs ---
  "nav.analyze": { tr: "Analiz", en: "Analyze" },
  "nav.watchlist": { tr: "İzleme", en: "Watchlist" },
  "nav.overview": { tr: "Genel Bakış", en: "Overview" },
  "nav.compare": { tr: "Karşılaştır", en: "Compare" },
  "nav.searchPlaceholder": { tr: "Kullanıcı, org veya owner/repo ara…", en: "Search a user, org, or owner/repo…" },
  "nav.tagline": { tr: "GitHub takip & analiz", en: "GitHub tracking & analysis" },

  // --- Overview ---
  "overview.welcomeTitle": { tr: "GitHub'ı izlemeye başla", en: "Start monitoring GitHub" },
  "overview.welcomeBody": {
    tr: "Bir kullanıcı veya repo ara, analiz et ve değişimleri zaman içinde takip etmek için izlemeye al.",
    en: "Search a user or repo, analyze it, and add it to your watchlist to track changes over time.",
  },
  "overview.watching": { tr: "İzlenenler", en: "Watching" },
  "overview.recent": { tr: "Son aramalar", en: "Recent searches" },
  "overview.quickAnalyze": { tr: "Hızlı analiz", en: "Quick analyze" },
  "overview.viewAll": { tr: "Tümünü gör", en: "View all" },
  "overview.changesPending": { tr: "değişiklik bekliyor", en: "with changes" },
  "overview.allQuiet": { tr: "Her şey sakin", en: "All quiet" },
  "overview.noWatches": { tr: "Henüz izlenen yok", en: "Nothing watched yet" },
  "analyze.modules": { tr: "Gelişmiş modüller", en: "Advanced modules" },
  "repo.createdAt": { tr: "Oluşturuldu", en: "Created" },
  "repo.updatedAt": { tr: "Güncellendi", en: "Updated" },

  // --- Watch Button ---
  "watch.add": { tr: "İzle", en: "Watch" },
  "watch.added": { tr: "İzleniyor", en: "Watching" },
  "watch.remove": { tr: "İzlemeyi bırak", en: "Unwatch" },

  // --- Dashboard / Watchlist ---
  "dash.title": { tr: "📌 İzleme Listesi", en: "📌 Watchlist" },
  "dash.subtitle": {
    tr: "İzlediğin profil ve repolardaki değişimleri zaman içinde takip et",
    en: "Track changes across the profiles and repos you follow over time",
  },
  "dash.empty": {
    tr: "Henüz hiçbir şey izlemiyorsun. Bir profil analiz et ya da repo kartından 'İzle'ye bas — değişimler burada görünür.",
    en: "You're not watching anything yet. Analyze a profile or hit 'Watch' on a repo card — changes show up here.",
  },
  "dash.emptyCta": { tr: "Analize git", en: "Go to Analyze" },
  "dash.refreshAll": { tr: "Tümünü kontrol et", en: "Check all" },
  "dash.checking": { tr: "Kontrol ediliyor...", en: "Checking..." },
  "dash.lastChecked": { tr: "Son kontrol", en: "Last checked" },
  "dash.never": { tr: "hiç", en: "never" },
  "dash.baseline": {
    tr: "📍 Başlangıç kaydedildi — değişimler bir sonraki kontrolde görünür",
    en: "📍 Baseline recorded — changes appear on the next check",
  },
  "dash.noChanges": { tr: "✓ Değişiklik yok", en: "✓ No changes" },
  "dash.changesSince": { tr: "değişiklikler — son kontrolden bu yana", en: "changes since last check" },
  "dash.checkNow": { tr: "Şimdi kontrol et", en: "Check now" },
  "dash.remove": { tr: "Listeden çıkar", en: "Remove from list" },
  "dash.newRepos": { tr: "yeni repo", en: "new repo(s)" },
  "dash.removedRepos": { tr: "kaldırılan repo", en: "removed repo(s)" },
  "dash.newRelease": { tr: "🚀 Yeni sürüm", en: "🚀 New release" },
  "dash.openDeepDive": { tr: "🔬 Derin analiz", en: "🔬 Deep dive" },
  "dash.viewProfile": { tr: "Profili analiz et", en: "Analyze profile" },
  "dash.snapshots": { tr: "kayıt", en: "snapshots" },
  "dash.error": { tr: "Kontrol başarısız", en: "Check failed" },

  // --- Metric labels (shared by diffs + deep dive) ---
  "metric.repoCount": { tr: "Repo", en: "Repos" },
  "metric.totalStars": { tr: "Yıldız", en: "Stars" },
  "metric.totalForks": { tr: "Fork", en: "Forks" },
  "metric.followers": { tr: "Takipçi", en: "Followers" },
  "metric.totalBytes": { tr: "Kod", en: "Code" },
  "metric.stars": { tr: "Yıldız", en: "Stars" },
  "metric.forks": { tr: "Fork", en: "Forks" },
  "metric.watchers": { tr: "İzleyici", en: "Watchers" },
  "metric.openIssues": { tr: "Açık issue", en: "Open issues" },
  "metric.openPRs": { tr: "Açık PR", en: "Open PRs" },
  "metric.releaseCount": { tr: "Sürüm", en: "Releases" },
  "metric.contributorCount": { tr: "Katkıcı", en: "Contributors" },

  // --- Deep Repo Analysis ---
  "deep.title": { tr: "🔬 Derin Repo Analizi", en: "🔬 Deep Repo Analysis" },
  "deep.loading": { tr: "Repo analiz ediliyor...", en: "Analyzing repository..." },
  "deep.back": { tr: "← Geri dön", en: "← Back" },
  "deep.openOnGithub": { tr: "GitHub'da aç", en: "Open on GitHub" },
  "deep.busFactor": { tr: "Bus Factor", en: "Bus Factor" },
  "deep.busFactorDesc": {
    tr: "Tüm commitlerin yarısından fazlasını birlikte üstlenen kişi sayısı",
    en: "Number of people who together own more than half of all commits",
  },
  "deep.busFactorWarn": {
    tr: "Düşük bus factor — proje az sayıda kişiye bağımlı",
    en: "Low bus factor — the project depends on a few people",
  },
  "deep.busFactorGood": { tr: "Sağlıklı katkı dağılımı", en: "Healthy contribution spread" },
  "deep.ofCommits": { tr: "commitlerin", en: "of commits" },
  "deep.contributors": { tr: "👥 Katkıcılar", en: "👥 Contributors" },
  "deep.topContributors": { tr: "En çok katkı yapanlar", en: "Top contributors" },
  "deep.commitCadence": { tr: "⏱️ Commit Temposu", en: "⏱️ Commit Cadence" },
  "deep.byHour": { tr: "Saate göre (UTC)", en: "By hour (UTC)" },
  "deep.byWeekday": { tr: "Güne göre", en: "By weekday" },
  "deep.recentActivity": { tr: "Son aktivite", en: "Recent activity" },
  "deep.commitsAnalyzed": { tr: "son commit analiz edildi", en: "recent commits analyzed" },
  "deep.days": { tr: "gün", en: "days" },
  "deep.languages": { tr: "🎨 Dil Dağılımı", en: "🎨 Language Distribution" },
  "deep.releases": { tr: "🚀 Sürümler", en: "🚀 Releases" },
  "deep.noReleases": { tr: "Henüz sürüm yok", en: "No releases yet" },
  "deep.totalReleases": { tr: "toplam sürüm", en: "total releases" },
  "deep.hygiene": { tr: "🩺 Proje Sağlığı", en: "🩺 Project Hygiene" },
  "deep.readme": { tr: "README", en: "README" },
  "deep.ci": { tr: "CI/CD", en: "CI/CD" },
  "deep.license": { tr: "Lisans", en: "License" },
  "deep.archived": { tr: "📦 Arşivlenmiş", en: "📦 Archived" },
  "deep.lastCommit": { tr: "Son commit", en: "Last commit" },
  "deep.created": { tr: "Oluşturuldu", en: "Created" },
  "deep.notFound": { tr: "Repo bulunamadı", en: "Repository not found" },
  "deep.dow.0": { tr: "Paz", en: "Sun" },
  "deep.dow.1": { tr: "Pzt", en: "Mon" },
  "deep.dow.2": { tr: "Sal", en: "Tue" },
  "deep.dow.3": { tr: "Çar", en: "Wed" },
  "deep.dow.4": { tr: "Per", en: "Thu" },
  "deep.dow.5": { tr: "Cum", en: "Fri" },
  "deep.dow.6": { tr: "Cmt", en: "Sat" },

  // Timeline
  "timeline.title": { tr: "Proje Zaman Çizelgesi", en: "Project Timeline" },
  "timeline.noChange": { tr: "Güncelleme yok (sadece nokta)", en: "No update (dot only)" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  return entry?.[locale] ?? key;
}
