<div align="center">

# Repo Monitor

> 🇹🇷 Bu dosya Türkçe dokümantasyondur. English version → [README.md](README.md)

GitHub kullanıcılarının **kendi yazdığı** repolarını analiz eden, her projede hangi dili ne kadar kullandığını gösteren ve tüm repoların genel dil dağılımını grafiklerle sunan bir web uygulaması. GitHub ile giriş yaparak **private repolarınızı** da analiz edebilirsiniz.

[![Canlı Demo](https://img.shields.io/badge/▶_Canlı_Demo-ceky--repo--monitor.vercel.app-black?style=for-the-badge&logo=vercel)](https://ceky-repo-monitor.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
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

### 📌 Takip & İzleme _(yeni)_
- **İzleme Listesi** — Herhangi bir kullanıcıyı veya repoyu "izle"; liste tarayıcında (IndexedDB) tutulur, hesap gerekmez
- **Değişim Diff'i** — Her kontrol bir snapshot olarak kaydedilir ve bir öncekiyle karşılaştırılır: yeni repolar, yıldız/fork artışı, yeni sürümler, açık issue/PR değişimleri ve dil oranı kaymaları kompakt değişim rozetleri olarak görünür
- **Başlangıç → Değişim** — İlk kontrol başlangıç noktasını kaydeder; sonraki kontroller tam olarak neyin değiştiğini gösterir
- **Sparkline & Geçmiş** — Her öğe için son snapshot'lara dayalı trend çizgisi (öğe başına 60 kayıt saklanır)
- **Tümünü / Tek Tek Kontrol** — Tüm listeyi veya tek bir öğeyi talep üzerine yenile (rate-limit dostu, sıralı)

### 🔬 Derin Repo Analizi _(yeni)_
- **Özel repo sayfası** — `/repo/{owner}/{repo}`, GitHub'ın tek ekranda göstermediği her şeyle
- **Bus Factor** — Tüm commitlerin %50'sinden fazlasını kaç kişinin üstlendiği, düşük/sağlıklı değerlendirmesiyle
- **Katkıcı Dağılımı** — En çok katkı yapanlar, avatar ve katkı barlarıyla
- **Commit Temposu** — Son günlük aktivite + güne göre + saate göre (UTC) commit dağılımı
- **Sürüm Zaman Çizelgesi** — Tarihleriyle son sürümler ve toplam sürüm sayısı
- **Issue / PR Ayrımı** — Gerçek açık-issue ve açık-PR sayıları (PR'lar pagination header'larından sayılır)
- **Proje Sağlığı** — README / CI / Lisans varlığı, arşiv durumu, oluşturma & son commit tarihleri

### Kimlik Doğrulama
- **GitHub OAuth ile Giriş** — GitHub hesabınızla OAuth 2.0 üzerinden oturum açın
- **Private Repo Erişimi** — Kendi profilinizi analiz ederken private repolarınız da dahil edilir
- **Güvenli Oturum** — Access token'lar imzalı HttpOnly cookie'lerde saklanır (JWT, `jose` kütüphanesi) — localStorage veya URL parametrelerinde asla
- **CSRF Koruması** — Her giriş akışında OAuth state parametresi doğrulaması

### Temel Analiz
- **Kullanıcı Profil Kartı** — Avatar, bio, repo sayısı, takipçi, toplam kod boyutu
- **Genel Dil Dağılımı** — Tüm repoların ortalaması (Pie Chart + Bar Chart + Tablo)
- **Repo Bazlı Analiz** — Her repo için dil barı, yüzdelik, boyut, tarih bilgileri
- **Private Repo Rozeti** — 🔒 rozeti private repoları listede açıkça işaretler
- **Genişletilebilir Detay** — Repo kartına tıklayınca mini pie chart + tam dil listesi
- **Commit Geçmişi Zaman Çizelgesi** — Repo bazlı dil kullanımı stacked area chart
- **12 İçgörü Metriği** — Baskın dil, ortalama repo boyutu, en aktif repo ve daha fazlası

### Arama & Navigasyon
- **URL ile Paylaşım** — `ceky-repo-monitor.vercel.app/?user=cekYc` → otomatik analiz
- **Son Aramalar** — Son 8 arama tıklanabilir chip olarak saklanır
- **Sıralama & Filtreleme** — Dile göre filtrele, güncelleme/yıldız/boyut/dil sayısı/isme göre sırala
- **Fork Filtreleme** — Sadece kullanıcının kendisinin yazdığı repolar

### Karşılaştırma & Dışa Aktarma
- **Kullanıcı Karşılaştırması** — İki kullanıcıyı head-to-head metrik barları ve grouped bar chart ile karşılaştırma
- **Profil Kartını PNG İndir** — Profil kartı + grafikler yüksek çözünürlüklü PNG olarak indirilir
- **Repo Kartlarını PNG İndir** — Bir veya birden fazla repo seçip tek görsel olarak dışa aktarma
- **Karşılaştırmayı PNG İndir** — Tam karşılaştırma görünümünü indirme

### Görselleştirme
- **Katkı Haritası** — GitHub tarzı 365 günlük katkı takvimi (token ile GraphQL API'den tam veri, tokensiz ~90 gün)
- **Gömülebilir Badge Oluşturucu** — GitHub README'niz için SVG dil badge'i + Markdown/HTML kopyalama
- **Dil Bazlı Repo Önerileri** — "TypeScript seviyorsun — şu trending repo'lara bak" GitHub Search ile

### Gelişmiş Analitik
- **Repo Sağlık & Güvenlik Skoru** — README, LICENSE, CI/CD, açıklama, güncellik, issue oranı → 0-100 skor, gauge chart
- **Geliştirici Personası & Oyunlaştırma** — 6 rozet: 🦉 Gece Kuşu, 🐦 Erken Kalkan, ⚔️ Hafta Sonu Savaşçısı, 🌍 Poliglot, 🔥 Seri Yapıcı, ♻️ Refactor Ustası
- **Özel Uzantı Tarayıcı** — Özel dosya uzantıları tanımlayın ve repoları GitHub Trees API ile tarayın
- **Akıllı Sunucu Cache** — Stale-while-revalidate caching, `X-Cache` header (HIT/STALE/MISS)

### Organizasyon & PWA
- **Organizasyon Analizi** — Herhangi bir GitHub org'un public repolarını analiz
- **PWA Desteği** — Yerel uygulama olarak yükle, service worker ile offline destek
- **Rate Limit Göstergesi** — Canlı API limit geri sayımı, renk kodlu uyarılar

### Kullanıcı Deneyimi
- **Dark / Light Mode** — Tema değiştirme
- **İngilizce / Türkçe (i18n)** — 250+ çeviri anahtarı
- **Gerçek Zamanlı İlerleme** — SSE streaming ile hangi repo analiz ediliyor göstergesi
- **İstemci Tarafı Cache** — Sonuçlar 30 dakika cache'lenir
- **Girişsiz Kullanım** — Token olmadan saatte 60 istek; GitHub ile giriş yapınca 5.000 istek + private repolar

## Kurulum

### Gereksinimler

- Node.js 18+
- npm, yarn veya pnpm

### Adımlar

```bash
git clone https://github.com/cekYc/repo-monitor-2.git
cd repo-monitor-2
npm install
```

### Ortam Değişkenleri

Proje kökünde `.env.local` dosyası oluşturun:

```env
# GitHub OAuth App (https://github.com/settings/developers)
GITHUB_CLIENT_ID=client_id_buraya
GITHUB_CLIENT_SECRET=client_secret_buraya

# JWT imzalama sırrı — üretmek için:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=32_karakter_secret_buraya

# Uygulama URL'i
NEXTAUTH_URL=http://localhost:3000
```

GitHub OAuth App oluşturmak için:
1. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. **Authorization callback URL**: `http://localhost:3000/api/auth/callback` (lokal için)
3. **Client ID**'yi kopyalayın, **Client Secret** oluşturun

### Çalıştır

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Kullanım

1. **Girişsiz** — GitHub kullanıcı adı yazıp **Analiz Et**'e tıklayın (sadece public repolar, saatte 60 istek)
2. **GitHub ile Giriş Yaparak** — Sağ üst köşedeki **GitHub ile Giriş Yap** butonuna tıklayın; kendi profilinizde private repolar da görünür, saatte 5.000 istek hakkınız olur

## API Endpoint'leri

| Endpoint | Açıklama |
|---|---|
| `GET /api/analyze?username=` | Tam kullanıcı analizi — token oturum cookie'sinden okunur |
| `GET /api/analyze-stream?username=` | SSE streaming analiz + ilerleme |
| `GET /api/analyze-org?org=` | Organizasyon analizi |
| `GET /api/repo-analysis?owner=&repo=` | Derin tek-repo analizi (katkıcılar, bus factor, commit temposu, sürümler, sağlık) |
| `GET /api/badge/{username}` | SVG dil badge'i (1 saat cache) |
| `GET /api/contributions?username=` | 365 günlük katkı verisi |
| `GET /api/suggestions?languages=` | Trending repo önerileri |
| `GET /api/commit-history?owner=&repo=` | Dil bazlı commit geçmişi |
| `GET /api/health-score?username=` | Repo sağlık & güvenlik skoru |
| `GET /api/persona?username=` | Geliştirici personası & rozetler |
| `GET /api/scan-extensions?username=&extensions=` | Özel uzantı taraması |
| `GET /api/rate-limit` | GitHub API rate limit durumu |
| `GET /api/auth/signin` | GitHub OAuth'a yönlendir |
| `GET /api/auth/callback` | OAuth callback — session cookie oluşturur |
| `POST /api/auth/signout` | Oturumu kapat |
| `GET /api/auth/session` | Mevcut kullanıcı bilgisi (token gönderilmez) |

## Tech Stack

| Teknoloji | Kullanım |
|---|---|
| [**Next.js 15**](https://nextjs.org/) (App Router) | Framework, SSE streaming, API routes |
| [**TypeScript 5**](https://www.typescriptlang.org/) | Tip güvenliği |
| [**Tailwind CSS 4**](https://tailwindcss.com/) | Utility-first styling |
| [**Recharts**](https://recharts.org/) | Pie chart, bar chart, area chart |
| [**Octokit**](https://github.com/octokit/rest.js) | GitHub REST API |
| [**jose**](https://github.com/panva/jose) | JWT imzalama & doğrulama (edge-runtime uyumlu) |
| [**html-to-image**](https://github.com/bubkoo/html-to-image) | PNG dışa aktarma |

## Geliştirici

[**@cekYc**](https://github.com/cekYc) tarafından geliştirilmiştir.

## Lisans

MIT