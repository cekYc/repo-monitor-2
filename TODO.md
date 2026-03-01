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

## 🟢 Düşük Öncelik (Nice to Have)

### 9. Organizasyon Analizi
- GitHub org repoları topluca analiz
- Takım bazlı dil dağılımı

### 10. Embeddable Badge Generator
- `![Languages](ceky-repo-monitor.vercel.app/badge/cekYc)` formatında badge
- GitHub README'lere doğrudan eklenebilir

### 11. Dil Bazlı Repo Önerileri
- "TypeScript seviyorsun — şu trending repo'lara bak" gibi öneriler

### 12. Contribution Heatmap
- GitHub katkı takvimi tarzında dil bazlı aktivite haritası

### 13. PWA (Progressive Web App)
- Offline erişim, ana ekrana ekle
- Push notification (yeni repo eklendiğinde)

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
- [x] İngilizce / Türkçe dil değiştirme (i18n — 130+ çeviri anahtarı)
- [x] Profil kartını PNG olarak indirme (html-to-image)
- [x] İki kullanıcıyı karşılaştırma (UserCompare bileşeni)
- [x] API Rate Limit göstergesi (RateLimitBadge)
