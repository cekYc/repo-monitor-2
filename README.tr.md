# Repo Monitor 2

> 🇹🇷 Bu dosya Türkçe dokümantasyondur. English version → [README.md](README.md)

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
- **Tokensiz Kullanım** — Token olmadan da çalışır (saatte 60 istek), token ile 5.000 istek
- **API Token Saklama** — Token localStorage'da kalır, her seferinde girmek gerekmez
- **Kullanıcı Cache** — Aranan kullanıcı verileri 30 dk cache'lenir, API limiti korunur
- **Dark / Light Mode** — Tema değiştirme butonu ile anında geçiş

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
3. Daha yüksek limit için [GitHub Settings > Personal access tokens](https://github.com/settings/tokens) adresinden bir token oluşturun (public repo erişimi yeterli)

## Tech Stack

| Teknoloji | Kullanım |
|---|---|
| **Next.js 16** (App Router) | Framework, API Routes, SSR |
| **TypeScript** | Tip güvenliği |
| **Tailwind CSS 4** | Styling |
| **Recharts** | Pie Chart, Bar Chart |
| **Octokit** | GitHub REST API |

## Geliştirici

[**@cekYc**](https://github.com/cekYc) tarafından geliştirilmiştir.

## Lisans

MIT
