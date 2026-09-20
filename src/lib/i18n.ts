export type Locale = "tr" | "en";

export const translations = {
  // Search history
  "search.recent": { tr: "Son Aramalar", en: "Recent Searches" },

  // Progress
  "progress.analyzing": { tr: "Analiz ediliyor...", en: "Analyzing..." },
  "progress.loading": { tr: "Repolar yükleniyor...", en: "Loading repos..." },

  // Cache
  "cache.loaded": { tr: "Cache'den yüklendi · 30 dk geçerli", en: "Loaded from cache · valid 30 min" },
  "cache.refresh": { tr: "Yenile", en: "Refresh" },

  // OverallStats
  "stats.followers": { tr: "Takipçi", en: "Followers" },
  "stats.following": { tr: "Takip", en: "Following" },
  "stats.language": { tr: "Dil", en: "Lang" },
  "stats.distribution.title": { tr: "Genel dil dağılımı", en: "Overall language distribution" },
  "stats.table.lang": { tr: "Dil", en: "Language" },
  "stats.table.percent": { tr: "Yüzde", en: "Percent" },
  "stats.table.size": { tr: "Boyut", en: "Size" },
  "stats.export": { tr: "PNG indir", en: "Download PNG" },
  "stats.exporting": { tr: "Hazırlanıyor...", en: "Preparing..." },

  // Exclusion
  "exclusion.banner": { tr: "repo genel dağılımdan hariç tutuluyor", en: "repos excluded from overall distribution" },
  "exclusion.includeAll": { tr: "Tümünü Dahil Et", en: "Include All" },

  // Insights
  "insights.favLang": { tr: "Favori Dil", en: "Favorite Language" },
  "insights.favLangDetail": { tr: "repoda birincil dil", en: "repos as primary language" },
  "insights.mostStarred": { tr: "En çok", en: "Most" },
  "insights.biggestRepo": { tr: "En Büyük Repo", en: "Biggest Repo" },
  "insights.mostLangs": { tr: "En Çok Dil", en: "Most Languages" },
  "insights.differentLangs": { tr: "farklı dil", en: "different languages" },
  "insights.newestRepo": { tr: "En Yeni Repo", en: "Newest Repo" },
  "insights.oldestRepo": { tr: "En Eski Repo", en: "Oldest Repo" },
  "insights.lastUpdated": { tr: "Son Kod Etkinliği", en: "Last Code Activity" },
  "insights.smallestRepo": { tr: "En Küçük Repo", en: "Smallest Repo" },

  // Repo List
  "repos.title": { tr: "Repolar", en: "Repositories" },
  "repos.allLangs": { tr: "Tüm Diller", en: "All Languages" },
  "repos.sort.updated": { tr: "Son Kod Etkinliği", en: "Last Code Activity" },
  "repos.sort.stars": { tr: "Yıldız Sayısı", en: "Star Count" },
  "repos.sort.size": { tr: "Kod Boyutu", en: "Code Size" },
  "repos.sort.languages": { tr: "Dil Sayısı", en: "Language Count" },
  "repos.sort.name": { tr: "İsim (A-Z)", en: "Name (A-Z)" },
  "repos.sort.created": { tr: "Oluşturulma Tarihi", en: "Created Date" },
  "repos.sort.forks": { tr: "Fork Sayısı", en: "Fork Count" },
  "repos.sort.score": { tr: "Proje Skoru (En Değerli)", en: "Project Score (Most Valuable)" },
  "repos.sort.commits": { tr: "Toplam Commit", en: "Total Commits" },
  "repos.sort.commitsLastMonth": { tr: "Son 1 Ayda Yapılan Commit", en: "Commits in Last 30 Days" },
  "repos.notFound": { tr: "Repo bulunamadı", en: "No repos found" },

  // RepoCard
  "repo.noLangs": { tr: "Bu repoda dil bilgisi bulunamadı (boş veya binary dosyalar)", en: "No language data found in this repo (empty or binary files)" },
  "repo.exclude": { tr: "Genel dağılımdan hariç tut", en: "Exclude from distribution" },
  "repo.include": { tr: "Genel dağılıma dahil et", en: "Include in distribution" },
  "repo.commitHistory.load": { tr: "Commit Geçmişini Göster", en: "Show Commit History" },
  "repo.commitHistory.hide": { tr: "Commit Geçmişini Gizle", en: "Hide Commit History" },

  // CommitHistory
  "commit.timeline": { tr: "Dil Dağılımı Zaman Çizelgesi", en: "Language Distribution Timeline" },
  "commit.commit": { tr: "commit", en: "commits" },
  "commit.notEnough": { tr: "Yeterli commit geçmişi bulunamadı (en az 2 commit gerekli)", en: "Not enough commit history (at least 2 commits required)" },
  "commit.changes": { tr: "İlk → Son Commit Değişimleri", en: "First → Last Commit Changes" },
  "commit.total": { tr: "Toplam", en: "Total" },

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
  "org.title": { tr: "Organizasyon analizi", en: "Organization analysis" },
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
  "compare.character.title": { tr: "Geliştirici karakteristiği", en: "Developer characteristics" },
  "compare.character.subtitle": {
    tr: "Ham toplamlar yerine teknik genişlik, proje derinliği, topluluk erişimi ve odak biçimini karşılaştırır.",
    en: "Compares technical breadth, project depth, community reach, and focus instead of raw totals.",
  },
  "compare.character.mapTitle": { tr: "Karakteristik haritası", en: "Characteristic map" },
  "compare.character.mapDesc": {
    tr: "Şekil, hangi özelliklerin daha baskın olduğunu gösterir; yüksek değer her zaman daha iyi anlamına gelmez.",
    en: "The shape shows which traits are more pronounced; a higher value is not always better.",
  },
  "compare.character.signal": { tr: "karakter sinyali", en: "trait signal" },
  "compare.dimension.breadth": { tr: "Teknik Genişlik", en: "Technical Breadth" },
  "compare.dimension.breadthDesc": {
    tr: "Dil çeşitliliği, ekosistem sayısı ve teknik alan dağılımı.",
    en: "Language diversity, ecosystem count, and technical domain distribution.",
  },
  "compare.dimension.depth": { tr: "Proje Derinliği", en: "Project Depth" },
  "compare.dimension.depthDesc": {
    tr: "Projelerin büyüklüğü, yaşam süresi, commit aralığı ve uzun dönem geri dönüşleri.",
    en: "Project size, lifetime, commit span, and long-term revisits.",
  },
  "compare.dimension.community": { tr: "Topluluk Erişimi", en: "Community Reach" },
  "compare.dimension.communityDesc": {
    tr: "Repo başına etkileşim, takipçi kitlesi ve projelerin dışarıda benimsenme oranı.",
    en: "Per-repo engagement, followers, and external project adoption.",
  },
  "compare.dimension.focus": { tr: "Odak", en: "Focus" },
  "compare.dimension.focusDesc": {
    tr: "Kod tabanının ilk bir ve üç dil çevresinde ne kadar yoğunlaştığı.",
    en: "How strongly the codebase concentrates around its top one and three languages.",
  },
  "compare.metric.languageDiversity": { tr: "Dil çeşitliliği", en: "Language diversity" },
  "compare.metric.effectiveLanguages": { tr: "etkin / toplam dil", en: "effective / total languages" },
  "compare.metric.ecosystemDiversity": { tr: "Ekosistem çeşitliliği", en: "Ecosystem diversity" },
  "compare.metric.domainMix": { tr: "Teknik alan dağılımı", en: "Technical domain mix" },
  "compare.metric.domainMixNote": {
    tr: "Dil kullanımından türetilen yaklaşık bir alan sinyalidir; proje amacını kesin olarak sınıflandırmaz.",
    en: "An approximate domain signal derived from language usage; it does not definitively classify project purpose.",
  },
  "compare.metric.systems": { tr: "Systems", en: "Systems" },
  "compare.metric.web": { tr: "Web", en: "Web" },
  "compare.metric.data": { tr: "Data", en: "Data" },
  "compare.metric.other": { tr: "Diğer", en: "Other" },
  "compare.metric.activeEcosystems": { tr: "aktif ekosistem", en: "active ecosystems" },
  "compare.metric.codePerRepo": { tr: "Repo başına kod", en: "Code per repo" },
  "compare.metric.activeDevelopment": { tr: "Aktif geliştirme süresi", en: "Active development span" },
  "compare.metric.activeDevelopmentNote": {
    tr: "Repo oluşturma tarihi ile son güncelleme arasındaki ortalama süre.",
    en: "Average time between repository creation and its latest update.",
  },
  "compare.metric.commitSpan": { tr: "Commit aralığı", en: "Commit span" },
  "compare.metric.longTermRevisit": { tr: "Uzun dönem tekrar ziyaret", en: "Long-term revisit rate" },
  "compare.metric.historyCoverage": { tr: "Commit geçmişi kapsamı", en: "Commit history coverage" },
  "compare.metric.starsPerRepo": { tr: "Yıldız / repo", en: "Stars / repo" },
  "compare.metric.forksPerRepo": { tr: "Fork / repo", en: "Forks / repo" },
  "compare.metric.followers": { tr: "Takipçi", en: "Followers" },
  "compare.metric.externalAdoption": { tr: "Dış benimsenme", en: "External adoption" },
  "compare.metric.externalAdoptionNote": {
    tr: "Yıldız veya fork alan repoların oranı.",
    en: "Share of repositories that received a star or fork.",
  },
  "compare.metric.top1Share": { tr: "İlk dilin payı", en: "Top language share" },
  "compare.metric.top3Share": { tr: "İlk 3 dilin payı", en: "Top 3 language share" },
  "compare.metric.coreLanguages": { tr: "Çekirdek diller", en: "Core languages" },
  "compare.metric.commitNote": {
    tr: "Commit metrikleri repo başına analiz edilebilen son 100 commit üzerinden hesaplanır; kapsam oranı veri yeterliliğini gösterir.",
    en: "Commit metrics use up to the latest 100 analyzable commits per repository; coverage indicates data availability.",
  },
  "compare.trait.breadthHigh": { tr: "Çok ekosistemli", en: "Multi-ecosystem" },
  "compare.trait.breadthMid": { tr: "Çok yönlü", en: "Versatile" },
  "compare.trait.breadthLow": { tr: "Uzmanlaşmış", en: "Specialized" },
  "compare.trait.depthHigh": { tr: "Uzun soluklu", en: "Long-horizon" },
  "compare.trait.depthMid": { tr: "Gelişen portföy", en: "Evolving portfolio" },
  "compare.trait.depthLow": { tr: "Hafif / deneysel", en: "Light / experimental" },
  "compare.trait.communityHigh": { tr: "Geniş erişimli", en: "Broad reach" },
  "compare.trait.communityMid": { tr: "Niş topluluklu", en: "Niche community" },
  "compare.trait.communityLow": { tr: "Düşük dış sinyal", en: "Low external signal" },
  "compare.trait.focusHigh": { tr: "Keskin odaklı", en: "Highly focused" },
  "compare.trait.focusMid": { tr: "Çekirdek stack", en: "Core stack" },
  "compare.trait.focusLow": { tr: "Keşifçi dağılım", en: "Exploratory mix" },
  "compare.insight.breadthSimilar": {
    tr: "Teknik genişlikleri benzer; fark daha çok kullandıkları ekosistemlerin türünde.",
    en: "Their technical breadth is similar; the difference lies mostly in the ecosystems they use.",
  },
  "compare.insight.breadthMore": {
    tr: "{user}, daha geniş bir dil ve ekosistem yelpazesine yayılıyor.",
    en: "{user} spans a broader range of languages and ecosystems.",
  },
  "compare.insight.depthSimilar": {
    tr: "Proje derinlikleri benzer; portföylerinin ölçeği ve yaşam döngüsü yakın.",
    en: "Their project depth is similar, with comparable scale and lifecycles.",
  },
  "compare.insight.depthMore": {
    tr: "{user}, daha uzun soluklu ve tekrar ziyaret edilen projeler geliştiriyor.",
    en: "{user} tends to build longer-lived projects that are revisited over time.",
  },
  "compare.insight.communitySimilar": {
    tr: "Topluluk erişimleri benzer bir ölçekte seyrediyor.",
    en: "Their community reach operates at a similar scale.",
  },
  "compare.insight.communityMore": {
    tr: "{user} projeleri GitHub üzerinde daha geniş bir dış etkileşim alanına ulaşıyor.",
    en: "{user}'s projects reach a broader field of external engagement on GitHub.",
  },
  "compare.insight.focusSimilar": {
    tr: "Dil odakları benzer yoğunlukta; ayrım çekirdek dillerin seçiminde.",
    en: "Their language focus is similarly concentrated; the distinction is in their core languages.",
  },
  "compare.insight.focusMore": {
    tr: "{user} daha konsantre bir dil çekirdeğine sahip; {other} daha keşifçi dağılıyor.",
    en: "{user} has a more concentrated language core, while {other} is more exploratory.",
  },

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
  "health.recentUpdate": { tr: "Son 90 günde kod etkinliği", en: "Code activity in last 90 days" },
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
  "nav.compare": { tr: "Karşılaştır", en: "Compare" },

  // --- Profile visibility ---
  "visibility.title": { tr: "Public Visibility Ratio", en: "Public Visibility Ratio" },
  "visibility.description": {
    tr: "Public profilinin, erişebildiğin toplam kaynak kodunu ne ölçüde temsil ettiğini gösterir.",
    en: "Shows how much of the total source code you can access is represented by your public profile.",
  },
  "visibility.ownerOnly": { tr: "yalnızca sen", en: "owner only" },
  "visibility.ratio": { tr: "kaynak kodu görünürlüğü", en: "source code visibility" },
  "visibility.publicCode": { tr: "Public kod", en: "Public code" },
  "visibility.privateCode": { tr: "Private kod", en: "Private code" },
  "visibility.outsider": { tr: "Üçüncü şahıs görünümü", en: "Third-party view" },
  "visibility.outsiderDesc": { tr: "GitHub'da dışarıdan görünen teknik profil", en: "Technical profile visible from outside on GitHub" },
  "visibility.full": { tr: "Senin tam görünümün", en: "Your complete view" },
  "visibility.fullDesc": { tr: "Public ve erişebildiğin private depolar birlikte", en: "Public and accessible private repositories combined" },
  "visibility.publicLabel": { tr: "public", en: "public" },
  "visibility.privateLabel": { tr: "tam profil", en: "full profile" },
  "visibility.repos": { tr: "Repo", en: "Repos" },
  "visibility.code": { tr: "Kod", en: "Code" },
  "visibility.languages": { tr: "Dil", en: "Languages" },
  "visibility.noCode": { tr: "Dil verisi yok", en: "No language data" },
  "visibility.hiddenTitle": { tr: "Hidden Technical Depth", en: "Hidden Technical Depth" },
  "visibility.hiddenDesc": { tr: "Private çalışmaların dışarıdan görünmeyen teknik sinyalleri", en: "Technical signals from private work that are not visible externally" },
  "visibility.privateRatio": { tr: "Private kod oranı", en: "Private code ratio" },
  "visibility.privateRatioDesc": { tr: "Toplam kaynak kodunun public profilde görünmeyen bölümü", en: "Share of total source code not visible in the public profile" },
  "visibility.privateLanguageDelta": { tr: "Private dil farkı", en: "Private language delta" },
  "visibility.noPrivateOnly": { tr: "Yalnızca private tarafta kullanılan ek dil yok", en: "No additional languages used only in private repositories" },
  "visibility.profileDifference": { tr: "Skill-profile farkı", en: "Skill-profile difference" },
  "visibility.profileDifferenceDesc": { tr: "Public ve tam dil dağılımı arasındaki mesafe", en: "Distance between public and complete language distributions" },
  "visibility.languageShifts": { tr: "Public → tam profil dil değişimi", en: "Public → complete profile language shift" },
  "visibility.noLanguageShift": { tr: "Anlamlı bir dil dağılımı farkı yok", en: "No meaningful language distribution difference" },
  "visibility.flagships": { tr: "Private flagship projeler", en: "Private flagship projects" },
  "visibility.flagshipDesc": { tr: "Proje puanı ve kod derinliğine göre", en: "Ranked by project score and code depth" },
  "visibility.noPrivate": { tr: "Bu analizde private depo bulunmuyor; public profil tam görünümü temsil ediyor.", en: "No private repositories are present in this analysis; the public profile represents the complete view." },
  "visibility.privacyNote": {
    tr: "Private depo adları ve teknik ayrıntılar yalnızca owner analizinde gösterilir. Public analizlerden bu değerler çıkarılamaz veya üçüncü şahıslara sunulmaz.",
    en: "Private repository names and technical details appear only in the owner analysis. These values cannot be inferred from or shown in public analyses.",
  },
  "repo.createdAt": { tr: "Oluşturuldu", en: "Created" },
  "repo.updatedAt": { tr: "Son Kod Etkinliği", en: "Last Code Activity" },

  // --- Watch Button ---
  "watch.add": { tr: "İzle", en: "Watch" },
  "watch.added": { tr: "İzleniyor", en: "Watching" },
  "watch.remove": { tr: "İzlemeyi bırak", en: "Unwatch" },

  // --- Metric labels (shared by diffs + deep dive) ---
  "metric.repoCount": { tr: "Repo", en: "Repos" },
  "metric.totalStars": { tr: "Yıldız", en: "Stars" },
  "metric.totalForks": { tr: "Fork", en: "Forks" },
  "metric.followers": { tr: "Takipçi", en: "Followers" },
  "metric.totalBytes": { tr: "Kod", en: "Code" },
  "metric.stars": { tr: "Yıldız", en: "Stars" },
  "metric.forks": { tr: "Fork", en: "Forks" },
  "metric.watchers": { tr: "İzleyici", en: "Watchers" },
  "sort.stars": { tr: "En Çok Yıldız", en: "Most Stars" },
  "sort.forks": { tr: "En Çok Fork", en: "Most Forks" },
  "sort.size": { tr: "En Büyük Boyut", en: "Largest Size" },
  "sort.score": { tr: "Proje Skoru (En Değerli)", en: "Project Score (Most Valuable)" },
  "metric.openIssues": { tr: "Açık issue", en: "Open issues" },
  "metric.openPRs": { tr: "Açık PR", en: "Open PRs" },
  "metric.releaseCount": { tr: "Sürüm", en: "Releases" },
  "metric.contributorCount": { tr: "Katkıcı", en: "Contributors" },

  // --- Deep Repo Analysis ---
  "deep.title": { tr: "🔬 Derin Repo Analizi", en: "🔬 Deep Repo Analysis" },
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
  "timeline.export": { tr: "📸 PNG Olarak İndir", en: "📸 Download as PNG" },
  "timeline.exporting": { tr: "Hazırlanıyor...", en: "Preparing..." },
  "timeline.totalDuration": { tr: "Geliştirme Aralığı", en: "Development Span" },
  "timeline.activeDays": { tr: "Aktif Geliştirme", en: "Active Dev. Days" },
  "timeline.lastMaintenance": { tr: "Son Bakım", en: "Last Maintenance" },
  "timeline.density": { tr: "Yoğunluk", en: "Density" },
  "timeline.projectScore": { tr: "Proje Skoru", en: "Project Score" },
  "timeline.days": { tr: "gün", en: "days" },

  // Leaderboard
  "leaderboard.title": { tr: "🏆 Proje Prestij & Değer Tablosu", en: "🏆 Project Prestige & Value Scoreboard" },
  "leaderboard.desc": { tr: "Efor derinliği, vitrin özeni, odak yoğunluğu ve momentum bazlı akıllı analiz. (Sırala: Başlığa tıkla | Detaylı Skor Röntgeni: Satıra tıkla)", en: "Smart analysis based on effort depth, presentation polish, focus, and momentum. (Sort: Click header | X-Ray Breakdown: Click row)" },
  "leaderboard.rank": { tr: "#", en: "#" },
  "leaderboard.repo": { tr: "Proje", en: "Project" },
  "leaderboard.score": { tr: "Prestij Skoru", en: "Prestige Score" },
  "leaderboard.density": { tr: "Yoğunluk", en: "Density" },
  "leaderboard.activeDays": { tr: "Aktif / Toplam", en: "Active / Total" },
  "leaderboard.lastUpdate": { tr: "Son Bakım", en: "Last Update" },
  "leaderboard.tierS": { tr: "🌟 Tier S: Başyapıt", en: "🌟 Tier S: Masterpiece" },
  "leaderboard.tierA": { tr: "🚀 Tier A: Asli Proje", en: "🚀 Tier A: Flagship" },
  "leaderboard.tierB": { tr: "🛠️ Tier B: Standart", en: "🛠️ Tier B: Standard" },
  "leaderboard.tierC": { tr: "🧪 Tier C: Deneme / Karalama", en: "🧪 Tier C: Sketch / Experiment" },
  "leaderboard.effort": { tr: "💪 Efor & Mesai Derinliği", en: "💪 Effort & Work Depth" },
  "leaderboard.polish": { tr: "🛡️ Vitrin & Özen", en: "🛡️ Presentation Polish" },
  "leaderboard.focus": { tr: "⚡ Odak & Yoğunluk", en: "⚡ Focus Density" },
  "leaderboard.recency": { tr: "🔥 Güncel Momentum", en: "🔥 Momentum Booster" },

  // ── Shell: navigation, search, preferences ───────────────────────────────
  "nav.watch": { tr: "İzleme", en: "Watch" },
  "search.placeholder": {
    tr: "Kullanıcı, org veya owner/repo",
    en: "User, org or owner/repo",
  },
  "search.asUser": { tr: "Kullanıcı olarak analiz et", en: "Analyze as user" },
  "search.asRepo": { tr: "Repo detayını aç", en: "Open repository detail" },
  "search.invalid": {
    tr: "Geçerli bir kullanıcı adı ya da owner/repo yazın",
    en: "Enter a valid username or owner/repo",
  },
  "locale.switch": { tr: "Switch to English", en: "Türkçe'ye geç" },

  // ── Identity & quota (one control, one place) ─────────────────────────────
  "auth.account": { tr: "Hesap ve kota", en: "Account and quota" },
  "auth.signIn": { tr: "Giriş yap", en: "Sign in" },
  "auth.signOut": { tr: "Çıkış", en: "Sign out" },
  "auth.signedIn": { tr: "GitHub ile bağlı", en: "Connected with GitHub" },
  "auth.anonymous": { tr: "Oturum açılmadı", en: "Not signed in" },
  "auth.anonymousHint": {
    tr: "Giriş yapınca saatlik limit 5.000 isteğe çıkar",
    en: "Signing in raises the hourly limit to 5,000 requests",
  },
  "auth.addToken": { tr: "Token ekle", en: "Add token" },
  "quota.label": { tr: "API kotası", en: "API quota" },
  "quota.used": { tr: "kullanıldı", en: "used" },
  "quota.reset": { tr: "Sıfırlanma", en: "Resets in" },
  "quota.exhausted": {
    tr: "Kota bitti. Giriş yapın ya da token ekleyin.",
    en: "Quota exhausted. Sign in or add a token.",
  },
  "quota.lowCeiling": {
    tr: "Tokensiz saatte 60 istek hakkınız var.",
    en: "Without a token you get 60 requests per hour.",
  },
  "token.advanced": { tr: "Gelişmiş: kişisel token", en: "Advanced: personal token" },
  "token.placeholder": { tr: "ghp_…", en: "ghp_…" },
  "token.hint": {
    tr: "Yalnızca bu tarayıcıda saklanır, istek başlığında gönderilir.",
    en: "Stored in this browser only and sent as a request header.",
  },
  "token.clear": { tr: "Token'ı sil", en: "Clear token" },
  "token.toggleVisibility": { tr: "Token'ı göster/gizle", en: "Show or hide token" },

  // ── Actions ───────────────────────────────────────────────────────────────
  "action.retry": { tr: "Tekrar dene", en: "Try again" },
  "action.cancel": { tr: "Vazgeç", en: "Cancel" },
  "action.clearFilters": { tr: "Filtreleri temizle", en: "Clear filters" },
  "action.showAll": { tr: "Tümünü göster", en: "Show all" },
  "action.showLess": { tr: "Daha az göster", en: "Show less" },
  "action.openOnGithub": { tr: "GitHub'da aç", en: "Open on GitHub" },

  // ── Errors: one localized pair per machine-readable code ──────────────────
  "error.not_found.title": { tr: "Bulunamadı", en: "Not found" },
  "error.not_found.body": {
    tr: "Bu isimde bir GitHub kullanıcısı, organizasyonu ya da reposu yok.",
    en: "No GitHub user, organization or repository goes by that name.",
  },
  "error.bad_credentials.title": { tr: "Token geçersiz", en: "Invalid token" },
  "error.bad_credentials.body": {
    tr: "Kayıtlı token GitHub tarafından kabul edilmedi. Yeniden giriş yapın ya da token'ı güncelleyin.",
    en: "GitHub rejected the saved token. Sign in again or replace the token.",
  },
  "error.rate_limit.title": { tr: "API kotası doldu", en: "API quota exhausted" },
  "error.rate_limit.body": {
    tr: "Saatlik istek limiti aşıldı. Giriş yapmak ya da token eklemek limiti 5.000'e çıkarır.",
    en: "The hourly request limit is spent. Signing in or adding a token raises it to 5,000.",
  },
  "error.bad_request.title": { tr: "Eksik istek", en: "Incomplete request" },
  "error.bad_request.body": {
    tr: "Aranan hedef okunamadı. Arama alanına kullanıcı adı ya da owner/repo yazın.",
    en: "The target could not be read. Enter a username or owner/repo in the search field.",
  },
  "error.network.title": { tr: "Bağlantı kurulamadı", en: "Connection failed" },
  "error.network.body": {
    tr: "İstek tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.",
    en: "The request did not complete. Check your connection and try again.",
  },
  "error.unknown.title": { tr: "Beklenmeyen hata", en: "Unexpected error" },
  "error.unknown.body": {
    tr: "Analiz tamamlanamadı. Tekrar denemek çoğu durumda yeterli olur.",
    en: "The analysis did not finish. Trying again usually resolves it.",
  },

  // ── First-open sample state ───────────────────────────────────────────────
  "sample.notice": {
    tr: "Bu örnek bir profildir — düzenin nasıl göründüğünü gösterir.",
    en: "This is a sample profile — it shows how the layout reads.",
  },
  "sample.action": { tr: "Bir profil ara", en: "Search a profile" },

  // ── Analyze: metrics ──────────────────────────────────────────────────────
  "metric.languages": { tr: "Dil", en: "Languages" },
  "metric.totalCommits": { tr: "Toplam commit", en: "Total commits" },
  "metric.lastMonth": { tr: "son 30 gün", en: "last 30 days" },
  "metric.avgRepoSize": { tr: "Repo ortalaması", en: "Average repo size" },
  "metric.avgLanguages": { tr: "Repo başına dil", en: "Languages per repo" },
  "stats.other": { tr: "Diğer", en: "Other" },
  "stats.noLanguages": {
    tr: "Bu seçimde dil verisi yok.",
    en: "No language data in this selection.",
  },

  // ── Analyze: repository grid ───────────────────────────────────────────────
  "repos.sortLabel": { tr: "Sıralama", en: "Sort" },
  "repos.forksExcluded": {
    tr: "Fork'lar analize dahil edilmez",
    en: "Forks are excluded from the analysis",
  },
  "repos.filter.label": { tr: "Listede filtrele", en: "Filter this list" },
  "repos.filter.placeholder": { tr: "Listede filtrele", en: "Filter this list" },
  "repos.noMatch": { tr: "Filtreye uyan repo yok", en: "No repository matches" },
  "repos.noMatchBody": {
    tr: "Filtreleri temizleyip tüm listeye dönebilirsiniz.",
    en: "Clear the filters to get the full list back.",
  },
  "repos.export.start": { tr: "PNG olarak seç", en: "Select for PNG" },
  "repo.private": { tr: "özel", en: "private" },
  "repo.details": { tr: "Ayrıntı", en: "Details" },
  "repo.deepDive": { tr: "Derin analiz", en: "Deep dive" },
  "repo.commitsShort": { tr: "commit", en: "commits" },

  // ── Analyze: secondary panels ─────────────────────────────────────────────
  "panels.title": { tr: "Ayrıntılı analiz", en: "Detailed analysis" },
  "panels.activity": { tr: "Aktivite", en: "Activity" },
  "panels.quality": { tr: "Kalite", en: "Quality" },
  "panels.persona": { tr: "Persona", en: "Persona" },
  "panels.insights": { tr: "İçgörüler", en: "Insights" },
  "panels.tools": { tr: "Araçlar", en: "Tools" },
  "org.prompt": {
    tr: "Bu hesabı organizasyon olarak da okuyabiliriz.",
    en: "This handle can also be read as an organization.",
  },
  "org.notAnOrg": {
    tr: "Bu hesap bir organizasyon değil.",
    en: "This handle is not an organization.",
  },

  // ── Watch ─────────────────────────────────────────────────────────────────
  "watch.title": { tr: "İzleme listesi", en: "Watchlist" },
  "watch.subtitle": {
    tr: "Her kontrol, bir öncekiyle karşılaştırılır.",
    en: "Every check is compared against the previous one.",
  },
  "watch.checkAll": { tr: "Tümünü kontrol et", en: "Check all" },
  "watch.checking": { tr: "Kontrol ediliyor…", en: "Checking…" },
  "watch.checkNow": { tr: "Şimdi kontrol et", en: "Check now" },
  "watch.lastChecked": { tr: "Son kontrol", en: "Last checked" },
  "watch.never": { tr: "hiç", en: "never" },
  "watch.snapshots": { tr: "kayıt", en: "snapshots" },
  "watch.baseline": {
    tr: "Başlangıç kaydı alındı. Bir sonraki kontrol değişimi gösterecek.",
    en: "Baseline recorded. The next check will show what changed.",
  },
  "watch.noBaseline": {
    tr: "Henüz kayıt yok. Kontrol ederek başlangıcı alın.",
    en: "No snapshot yet. Run a check to record the baseline.",
  },
  "watch.noChanges": {
    tr: "Son kontrolden bu yana değişiklik yok.",
    en: "Nothing changed since the last check.",
  },
  "watch.newRelease": { tr: "Yeni sürüm", en: "New release" },
  "watch.newRepos": { tr: "yeni repo", en: "new repos" },
  "watch.removedRepos": { tr: "kaldırılan repo", en: "removed repos" },
  "watch.typeUser": { tr: "kullanıcı", en: "user" },
  "watch.typeRepo": { tr: "repo", en: "repo" },
  "watch.viewProfile": { tr: "Profili aç", en: "Open profile" },
  "watch.empty": { tr: "Henüz izlenen bir şey yok", en: "Nothing is being watched yet" },
  "watch.emptyBody": {
    tr: "Bir profil ya da repo analiz edip “İzle”ye basın; değişimler burada listelenir.",
    en: "Analyze a profile or repository and press Watch; changes show up here.",
  },
  "watch.emptyCta": { tr: "Bir profil ara", en: "Search a profile" },

  // ── Compare ───────────────────────────────────────────────────────────────
  "compare.pageTitle": { tr: "İki geliştiriciyi karşılaştır", en: "Compare two developers" },
  "compare.pageHint": {
    tr: "Dil dağılımı, hacim ve topluluk sinyallerini yan yana koyar.",
    en: "Puts language mix, volume and community signals side by side.",
  },
  "compare.sideA": { tr: "Birinci kullanıcı", en: "First user" },
  "compare.sideB": { tr: "İkinci kullanıcı", en: "Second user" },
  "compare.run": { tr: "Karşılaştır", en: "Compare" },
  "compare.running": { tr: "Karşılaştırılıyor…", en: "Comparing…" },
  "compare.needBoth": {
    tr: "Karşılaştırma için iki kullanıcı adı gerekir.",
    en: "Two usernames are required to compare.",
  },
  "compare.emptyTitle": { tr: "Karşılaştırma bekliyor", en: "Ready to compare" },
  "compare.emptyBody": {
    tr: "İki kullanıcı adı girin; sonuç aynı sayfada açılır.",
    en: "Enter two usernames and the result opens on this page.",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  return entry?.[locale] ?? key;
}
