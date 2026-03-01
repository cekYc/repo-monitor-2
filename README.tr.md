<div align="center">

# Repo Monitor

> 🇹🇷 Bu dosya Türkçe dokümantasyondur. English version → [README.md](README.md)

GitHub kullanıcılarının **kendi yazdığı** public repolarını analiz eden, her projede hangi dili ne kadar kullandığını gösteren ve tüm repoların genel dil dağılımını grafiklerle sunan bir web uygulaması.

[![Canlı Demo](https://img.shields.io/badge/▶_Canlı_Demo-ceky--repo--monitor.vercel.app-black?style=for-the-badge&logo=vercel)](https://ceky-repo-monitor.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Recharts](https://img.shields.io/badge/Recharts-2-8884d8)
![License](https://img.shields.io/badge/Lisans-MIT-green)

### Dil Badge'i (Repo Monitor ile oluşturuldu)

![cekYc Languages](https://ceky-repo-monitor.vercel.app/api/badge/cekYc)

> Kendi badge'inizi ekleyin: `![Languages](https://ceky-repo-monitor.vercel.app/api/badge/KULLANICI_ADINIZ)`

</div>

---

## Özellikler

### Temel Analiz
- **Kullanıcı Profil Kartı** — Avatar, bio, repo sayısı, takipçi, toplam kod boyutu
- **Genel Dil Dağılımı** — Tüm repoların ortalaması (Pie Chart + Bar Chart + Tablo)
- **Repo Bazlı Analiz** — Her repo için dil barı, yüzdelik, boyut, tarih bilgileri
- **Genişletilebilir Detay** — Repo kartına tıklayınca mini pie chart + tam dil listesi
- **Commit Geçmişi Zaman Çizelgesi** — Repo bazlı dil kullanımı stacked area chart
- **12 İçgörü Metriği** — Baskın dil, ortalama repo boyutu, en aktif repo ve daha fazlası

### Arama & Navigasyon
- **URL ile Paylaşım** — `ceky-repo-monitor.vercel.app/?user=cekYc` → otomatik analiz
- **Son Aramalar** — Son 8 arama tıklanabilir chip olarak saklanır
- **Sıralama & Filtreleme** — Dile göre filtrele, güncelleme/yıldız/boyut/dil sayısı/isme göre sırala
- **Fork Filtreleme** — Sadece kullanıcının kendisinin yazdığı repolar

### Karşılaştırma & Dışa Aktarma
- **Kullanıcı Karşılaştırması** — İki kullanıcıyı head-to-head metrik barları, kazanan badge'leri ve grouped bar chart ile karşılaştırma
- **Profil Kartını PNG İndir** — Profil kartı + grafikler yüksek çözünürlüklü PNG olarak indirilir
- **Repo Kartlarını PNG İndir** — Bir veya birden fazla repo seçip tek görsel olarak dışa aktarma
- **Karşılaştırmayı PNG İndir** — Tam karşılaştırma görünümünü indirme

### Görselleştirme
- **Katkı Haritası** — GitHub tarzı 365 günlük katkı takvimi (token ile GraphQL API'den tam veri, tokensiz ~90 gün)
- **Gömülebilir Badge Oluşturucu** — GitHub README'niz için SVG dil badge'i + Markdown/HTML kopyalama
- **Dil Bazlı Repo Önerileri** — "TypeScript seviyorsun — şu trending repo'lara bak" GitHub Search ile

### Gelişmiş Analitik
- **Repo Sağlık & Güvenlik Skoru** — README, LICENSE, CI/CD, açıklama, güncellik, issue oranı kontrolü → 0-100 skor, Mükemmel/İyi/Orta/Zayıf derecelendirme, gauge chart
- **Geliştirici Personası & Oyunlaştırma** — Commit saat analizi (Events API saat, GraphQL takvim) → 6 rozet: 🦉 Gece Kuşu, 🐦 Erken Kalkan, ⚔️ Hafta Sonu Savaşçısı, 🌍 Poliglot, 🔥 Seri Yapıcı, ♻️ Refactor Ustası
- **Özel Uzantı Tarayıcı** — Özel dosya uzantıları tanımlayın (örn: `.cky` → Ceky Lang) ve repoları GitHub Trees API ile tarayın
- **Akıllı Sunucu Cache** — Stale-while-revalidate caching, arka plan yenilemesi, `X-Cache` header (HIT/STALE/MISS)

### Organizasyon & PWA
- **Organizasyon Analizi** — Herhangi bir GitHub org'un public repolarını dil dağılımıyla analiz
- **PWA Desteği** — Yerel uygulama olarak yükle, service worker ile offline destek
- **Rate Limit Göstergesi** — Canlı API limit geri sayımı, renk kodlu uyarılar

### Kullanıcı Deneyimi
- **Dark / Light Mode** — Tema değiştirme butonu ile anında geçiş
- **İngilizce / Türkçe (i18n)** — 250+ çeviri anahtarı ile tam iki dil desteği
- **Gerçek Zamanlı İlerleme** — SSE streaming ile hangi repo analiz ediliyor göstergesi
- **İstemci Tarafı Cache** — Sonuçlar 30 dakika cache'lenir
- **Tokensiz Kullanım** — Token olmadan saatte 60 istek, token ile 5.000
- **Token Saklama** — Token localStorage'da kalır

## Kurulum

```bash
git clone https://github.com/cekYc/repo-monitor-2.git
cd repo-monitor-2
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Kullanım

1. Analiz etmek istediğiniz GitHub kullanıcı adını yazın
2. "Analiz Et" butonuna tıklayın — token olmadan da çalışır
3. Daha yüksek limit ve tam katkı haritası için [GitHub Settings > Personal access tokens](https://github.com/settings/tokens) adresinden bir token oluşturun
4. Grafikleri inceleyin, repoları filtreleyin, kullanıcıları karşılaştırın, PNG olarak indirin

> **İpucu:** Token sadece tarayıcınızın localStorage'ında saklanır ve sadece GitHub API'ye gönderilir.

## API Endpoints

| Endpoint | Açıklama |
|---|---|
| `GET /api/analyze?username=` | Tam kullanıcı analizi (JSON) |
| `GET /api/analyze-stream?username=` | SSE streaming analiz + ilerleme |
| `GET /api/analyze-org?org=` | Organizasyon analizi |
| `GET /api/badge/{username}` | SVG dil badge'i (1 saat cache) |
| `GET /api/contributions?username=` | 365 günlük katkı verisi |
| `GET /api/suggestions?languages=` | Trending repo önerileri |
| `GET /api/commit-history?owner=&repo=` | Dil bazlı commit geçmişi |
| `GET /api/health-score?username=` | Repo sağlık & güvenlik skoru |
| `GET /api/persona?username=` | Geliştirici personası & rozetler |
| `GET /api/scan-extensions?username=&extensions=` | Özel uzantı taraması |
| `GET /api/rate-limit` | GitHub API rate limit durumu |

## Tech Stack

| Teknoloji | Kullanım |
|---|---|
| [**Next.js 16**](https://nextjs.org/) (App Router, Turbopack) | Framework, SSE streaming, API routes |
| [**TypeScript 5**](https://www.typescriptlang.org/) | Tip güvenliği |
| [**Tailwind CSS 4**](https://tailwindcss.com/) | Utility-first styling |
| [**Recharts**](https://recharts.org/) | Pie chart, bar chart, area chart |
| [**Octokit**](https://github.com/octokit/rest.js) | GitHub REST API |
| [**html-to-image**](https://github.com/bubkoo/html-to-image) | PNG dışa aktarma |

## Geliştirici

[**@cekYc**](https://github.com/cekYc) tarafından geliştirilmiştir.

## Lisans

MIT
