# Repo Monitor — Roadmap & TODO

> Kullanıcıların siteyi aktif olarak kullanması ve paylaşması için gereken özellikler, öncelik sırasına göre.

---

## ~~🔴 Yüksek Öncelik~~ ✅ Tamamlandı

### ~~1. URL ile Paylaşılabilir Profiller~~ ✅
- `ceky-repo-monitor.vercel.app/?user=cekYc` → otomatik analiz başlar
- `useSearchParams` + `useRouter` ile URL güncellenir

### ~~2. Son Aramalar Geçmişi~~ ✅
- Son 8 aranan kullanıcı localStorage'da saklanır
- Arama formunun altında "Son Aramalar" chips olarak görünür
- Tek tıkla tekrar analiz

### ~~3. Open Graph & SEO Meta Tags~~ ✅
- layout.tsx'te kapsamlı OG/Twitter/SEO metadata
- Doğru title, description, keywords, authors

### ~~4. Analiz İlerleme Göstergesi~~ ✅
- SSE (Server-Sent Events) ile gerçek zamanlı progress
- Hangi repo analiz ediliyor + yüzde göstergesi + progress bar

---

## ~~🟡 Orta Öncelik~~ ✅ Tamamlandı

### ~~5. İngilizce / Türkçe Dil Değiştirme (i18n)~~ ✅
- Tüm UI metinleri i18n sistemiyle çevrildi (130+ çeviri anahtarı)
- LocaleProvider + useLocale hook + LocaleToggle bileşeni
- Dil tercihi localStorage'da saklanır
- Tüm bileşenler (SearchForm, OverallStats, RepoCard, CommitHistory, ThemeToggle) i18n destekli

### ~~6. Profil Kartını Resim Olarak İndir (Export PNG)~~ ✅
- html-to-image kütüphanesi ile profil + dağılım + metrikler PNG olarak indirilebilir
- 2x piksel oranı, dark/light mode desteği
- OverallStats bileşeninde "📸 PNG İndir" butonu

### ~~7. İki Kullanıcıyı Karşılaştır~~ ✅
- Yan yana dil dağılımı karşılaştırması (grouped BarChart)
- Ortak diller, kullanıcıya özgü diller, toplam kod/repo/yıldız
- SearchForm'da karşılaştırma modu toggle

### ~~8. API Rate Limit Göstergesi~~ ✅
- Sağ alt köşede sabit badge ile kalan API istek sayısı
- 60 saniyede bir otomatik yenileme
- Limit azaldığında renk kodlu uyarı (yeşil/sarı/kırmızı)
- Genişletilebilir detay paneli

---

## ~~🟢 Düşük Öncelik (Nice to Have)~~ ✅ Tamamlandı

### ~~9. Organizasyon Analizi~~ ✅
- GitHub org repoları topluca analiz
- Takım bazlı dil dağılımı
- Org profil kartı + PieChart + BarChart
- Katlanabilir panel (OrgAnalyzer bileşeni)

### ~~10. Embeddable Badge Generator~~ ✅
- `![Languages](ceky-repo-monitor.vercel.app/api/badge/cekYc)` formatında SVG badge
- GitHub README'lere doğrudan eklenebilir
- Markdown ve HTML embed kodu + kopyala butonu
- Top 8 dil renkli bar + legend

### ~~11. Dil Bazlı Repo Önerileri~~ ✅
- Kullanıcının en çok kullandığı 3 dile göre trending repo önerileri
- Stars, forks, açıklama ile suggestion kartları
- GitHub Search API (stars>1000)

### ~~12. Contribution Heatmap~~ ✅
- GitHub katkı takvimi tarzında 365 günlük aktivite haritası
- 4 seviyeli yeşil renk skalası
- Ay başlıkları + gün etiketleri + legend
- GitHub Events API ile veri

### ~~13. PWA (Progressive Web App)~~ ✅
- manifest.json + Service Worker (network-first, cache fallback)
- Ana ekrana ekle butonu (beforeinstallprompt)
- SVG ikonlar (192x192, 512x512)
- Viewport theme-color + apple-web-app meta

---

## ~~🔵 Advanced Features~~ ✅ Tamamlandı

### ~~14. Smart Server Cache & Background Revalidation~~ ✅
- Server-side in-memory cache (stale-while-revalidate pattern)
- `src/lib/cache.ts` — SmartCache sınıfı (TTL + maxAge + revalidation lock)
- /api/analyze yanıtlarına X-Cache header (HIT / STALE / MISS)
- 15 dk fresh → background revalidation → 60 dk expire
- Health score, persona, extensions API'larında da aktif

### ~~15. Repo Health & Security Score~~ ✅
- /api/health-score — README, LICENSE, Description, CI/CD, recency, issue ratio kontrolleri
- Her repo için 0-100 skor (6 kriter × ağırlıklı puan)
- Genel ortalama ile Excellent/Good/Fair/Poor derecelendirme
- Gauge chart, repo bazlı breakdown, emoji göstergeleri
- HealthScore bileşeni (katlanabilir, lazy-load)

### ~~16. Developer Persona & Gamification~~ ✅
- /api/persona — GraphQL + Events API ile commit saat/gün analizi
- 6 badge: 🦉 Night Owl, 🐦 Early Bird, ⚔️ Weekend Warrior, 🌍 Polyglot, 🔥 Streaker, ♻️ Refactor Master
- Commit saat dağılımı BarChart + gün dağılımı BarChart
- En verimli saat, en aktif gün, en uzun streak metrikleri
- DeveloperPersona bileşeni (katlanabilir, gradient badge kartları)

### ~~17. Custom Extension Scanner~~ ✅
- /api/scan-extensions — GitHub Trees API ile özel uzantı taraması
- Kullanıcı tanımlı extension → language → color mappingleri
- localStorage'da kalıcı (repo-monitor-custom-extensions)
- Tarama sonuçları: dosya sayısı, byte boyutu, repo bazlı dosya listesi
- CustomExtensionScanner bileşeni (katlanabilir, form + sonuçlar)

---

## ✅ Tamamlanan Özellikler

- [x] GitHub API ile repo analizi (non-fork)
- [x] Genel dil dağılımı (Pie + Bar + Tablo)
- [x] Repo bazlı detaylı analiz
- [x] Genişletilebilir repo kartları
- [x] Filtreleme ve sıralama (5 kriter)
- [x] API token opsiyonel (tokensiz 60 req/hr)
- [x] Token localStorage'da saklanır
- [x] Kullanıcı verisi 30 dk cache
- [x] Dark / Light mode toggle
- [x] 12 insight metriği
- [x] Repo'ları genel dağılımdan hariç tutma (dinamik)
- [x] Commit geçmişi dil zaman çizelgesi (Stacked Area Chart)
- [x] Profesyonel İngilizce README + Türkçe README
- [x] Vercel'de canlı deploy
- [x] URL ile paylaşılabilir profiller (`?user=` query param)
- [x] Son aramalar geçmişi (localStorage + chips)
- [x] Open Graph & SEO meta tags
- [x] SSE streaming analiz ilerleme göstergesi
- [x] İngilizce / Türkçe dil değiştirme (i18n — 250+ çeviri anahtarı)
- [x] Profil kartını PNG olarak indirme (html-to-image)
- [x] İki kullanıcıyı karşılaştırma (UserCompare bileşeni)
- [x] API Rate Limit göstergesi (RateLimitBadge)
- [x] Organizasyon analizi (OrgAnalyzer bileşeni + /api/analyze-org)
- [x] Embeddable SVG badge generator (/api/badge/[username] + BadgeGenerator)
- [x] Dil bazlı repo önerileri (RepoSuggestions + /api/suggestions)
- [x] Contribution Heatmap (ContributionHeatmap + /api/contributions)
- [x] PWA desteği (manifest.json, sw.js, PwaInstallButton)
- [x] Repo kartları PNG export (seçim + toplu export)
- [x] Gelişmiş karşılaştırma (head-to-head bars, 🏆 winner, PNG export)
- [x] Smart server cache (stale-while-revalidate, background revalidation)
- [x] Repo Health & Security Score (6-kriter, gauge, breakdown)
- [x] Developer Persona & Gamification (6 badge, commit analizi)
- [x] Custom Extension Scanner (özel uzantı tarama, Trees API)
