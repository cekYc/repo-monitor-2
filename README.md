# Repo Monitor 2

GitHub kullanıcılarının **kendi yazdığı** public repolarını analiz eden, her projede hangi dili ne kadar kullandığını gösteren ve tüm repoların genel dil dağılımını grafiklerle sunan bir web uygulaması.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Recharts](https://img.shields.io/badge/Recharts-2-8884d8)

## Özellikler

- **Kullanıcı Profil Kartı** — Avatar, bio, repo sayısı, takipçi, toplam kod boyutu
- **Genel Dil Dağılımı** — Tüm repoların ortalaması (Pie Chart + Bar Chart + Tablo)
- **Repo Bazlı Analiz** — Her repo için dil barı, yüzdelik, boyut, tarih bilgileri
- **Genişletilebilir Detay** — Repo kartına tıklayınca mini pie chart + tam dil listesi
- **Filtreleme & Sıralama** — Dile göre filtrele, güncelleme/yıldız/boyut/dil sayısına göre sırala
- **Fork Filtreleme** — Sadece kullanıcının kendisinin yazdığı repolar (fork'lar hariç)
- **API Token Saklama** — Token localStorage'da kalır, her seferinde girmek gerekmez
- **Kullanıcı Cache** — Aranan kullanıcı verileri 30 dk cache'lenir, API limiti korunur
- **Dark Mode** — Sistem temasına otomatik uyum

## Kurulum

```bash
git clone https://github.com/cekYc/repo-monitor-2.git
cd repo-monitor-2
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Kullanım

1. [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) adresinden bir token oluşturun (public repo erişimi yeterli)
2. Token'ı uygulamaya girin (otomatik olarak tarayıcıda saklanır)
3. Analiz etmek istediğiniz GitHub kullanıcı adını yazın
4. "Analiz Et" butonuna tıklayın

## Tech Stack

| Teknoloji | Kullanım |
|---|---|
| **Next.js 16** (App Router) | Framework, API Routes, SSR |
| **TypeScript** | Tip güvenliği |
| **Tailwind CSS 4** | Styling |
| **Recharts** | Pie Chart, Bar Chart |
| **Octokit** | GitHub REST API |

## Proje Yapısı

```
src/
├── app/
│   ├── api/analyze/route.ts   # GitHub verisi çeken API endpoint
│   ├── globals.css             # Global stiller
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Ana sayfa (client component)
├── components/
│   ├── OverallStats.tsx        # Genel dil dağılımı grafikleri
│   ├── RepoCard.tsx            # Repo kartları
│   └── SearchForm.tsx          # Arama formu
└── lib/
    ├── github.ts               # GitHub API servisi
    └── utils.ts                # Yardımcı fonksiyonlar, renk paleti
```

## Lisans

MIT
