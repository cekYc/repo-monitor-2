# Repo Monitor — Arayüz Tasarımı

Bu belge arayüzün kurallarını tanımlar: sayfa iskeleti, bileşen listesi,
renk/tipografi ölçeği, mobil kırılım noktaları ve empty/error davranışları.
Kod ile birlikte güncellenir; bir kural burada yoksa kuralın kendisi yok
demektir.

---

## 1. Bilgi mimarisi ve sayfa iskeleti

Sidebar yok. Dört gerçek rota var; her biri tek bir soruya cevap verir.

| Rota | Ad | Cevapladığı soru |
|---|---|---|
| `/` | Analiz | Bu hesap bugün neye benziyor? |
| `/watch` | İzleme | Son kontrolden bu yana ne değişti? |
| `/compare` | Karşılaştır | A ile B arasındaki fark ne? |
| `/repo/[owner]/[repo]` | Repo detay | Bu tek repo ne durumda? |

Repo detay sekme çubuğunda yer almaz; Analiz bölümünün altındaki bir yaprak
sayfadır ve o bölümün sekmesi aktif görünür.

### Uygulama çerçevesi (`src/app/layout.tsx` → `AppFrame`)

Çerçeve dört sayfanın tamamını sarar. "Arama tek yerde" kuralı bu yüzden
yapısal bir garantidir: arama alanı çerçevede yaşar, sayfaların içinde değil.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [logo] [Analiz İzleme Karşılaştır]  [ tek arama … / ]  [TR] [☾] [●60] │  h-56px
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   <main>  max-w-1200px · px-16/24 · py-20                            │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ footer (yalnızca ≥768px)                                             │
└──────────────────────────────────────────────────────────────────────┘
      mobilde bunun yerine alt sekme: [Analiz] [İzleme] [Karşılaştır]
```

Header'da tek bir kimlik/kota kontrolü vardır: `SessionMenu`. Giriş, çıkış,
kota rozeti, kişisel token alanı ve PWA kurulumu o tek düğmenin popover'ında
toplanır.

### Analiz sonucu hiyerarşisi (`/`)

Sıra sabittir; her seviye bir öncekinden daha az insan ilgilendirir.

1. **Profil özeti** — avatar, ad, bio, takipçi/takip/repo/toplam boyut,
   dil şeridi önizlemesi, `İzle` + PNG + GitHub aksiyonları.
2. **Dil DNA'sı** — donut + yatay bar + kısa tablo (6 satır, "Tümünü göster").
3. **Özet metrikler** — tam 8 kutu. Takipçi/takip burada tekrarlanmaz.
4. **Repo grid** — filtre + dil + sıralama, 1/2/3 kolon.
5. **Ayrıntılı analiz** — tek sekme şeridi: Aktivite · Kalite · Persona ·
   İçgörüler · Araçlar. Sekme açılana kadar içeriği mount edilmez, yani
   kapalıyken API kotası harcamaz.

### İlk açılış kuralı

`/` her koşulda dolu açılır. Sıra:

1. `?user=<login>` varsa onu analiz et.
2. Oturum açıksa kullanıcının kendi profilini aç (URL'e `?user=` yazılır).
3. Daha önce bakılmış bir profil varsa onu aç.
4. Hiçbiri yoksa **örnek veri** ile tam düzeni göster (`sample-analysis.ts`),
   üstte tek satır uyarı ve tek aksiyon: "Bir profil ara".

Kota bittiyse: son önbellek + üstte `rate_limit` bandı ve "Giriş yap /
Token ekle" aksiyonları. Önbellek de yoksa örnek veri + aynı bant.
**Boş sayfa hiçbir dalda oluşmaz.**

---

## 2. Bileşen listesi

### Çerçeve — `src/components/shell/`
| Bileşen | Sorumluluk |
|---|---|
| `AppFrame` | Header + main + footer + alt sekme çubuğu |
| `GlobalSearch` | Uygulamanın tek arama alanı; `user`, `org`, `owner/repo`, github.com URL'i çözer; `/` ve `⌘K` kısayolu; son aramalar önerisi |
| `NavTabs` | `NavInline` (masaüstü, header içi) ve `NavBottomBar` (mobil, alt çubuk) |
| `SessionMenu` | Tek kimlik/kota kontrolü: oturum, kota çubuğu + geri sayım, gizli token alanı, PWA |
| `LocaleToggle` / `ThemeToggle` | Dil ve tema; mobilde `SessionMenu` içine katlanır |
| `PwaInstallButton` | Kurulum istemi (popover içinde, ekranda yüzmez) |
| `useWatchCount` | İzleme rozeti sayacı |

### Arayüz ilkelleri — `src/components/ui/`
`Card` · `SectionHeader` · `StatTile` · `EmptyState` · `ErrorNotice` ·
`Skeleton` / `SkeletonText` / `SkeletonCard` · `Collapsible` · `Segmented` ·
`Avatar`

### Analiz — `src/components/analyze/`
`AnalyzeScreen` (durum makinesi) · `ProfileSummary` · `LanguageDna` ·
`MetricGrid` · `RepoGrid` · `RepoCard` · `SecondaryPanels` · `InsightsPanel` ·
`OrgPanel` · `AnalyzeSkeleton`

### İzleme / Karşılaştır
`watch/WatchScreen` · `compare/CompareScreen`

### Korunan modüller (ikincil sekmelerin içinde)
`ContributionHeatmap` · `RepoTimeline` · `HealthScore` · `ProjectLeaderboard` ·
`DeveloperPersona` · `ProfileVisibility` · `BadgeGenerator` ·
`CustomExtensionScanner` · `RepoSuggestions` · `RepoDeepDive` ·
`CommitHistory` · `UserCompare` · `SegmentBar` · `WatchButton` ·
`GitHubAvatar`

### Sağlayıcılar ve yardımcılar
`ThemeProvider` · `LocaleProvider` · `SessionProvider` · `useFormat`
`lib/`: `target` (arama çözümleme) · `errors` + `api-error` (hata kodları) ·
`quota` (kota renk kuralı) · `token` + `request-token` · `analysis-cache` ·
`recent` · `sample-analysis` · `use-stored` · `ui-events`

---

## 3. Renk ve tipografi

Bütün değerler `src/app/globals.css` içinde token'dır; bileşenlerde çıplak
renk yazılmaz. Her token'ın açık ve koyu karşılığı vardır.

### Yüzeyler ve metin

| Token | Koyu (varsayılan) | Açık |
|---|---|---|
| `--canvas` | `#09090b` | `#fafafa` |
| `--surface` | `#101014` | `#ffffff` |
| `--panel` | `#17171c` | `#f4f4f5` |
| `--hairline` | `#232329` | `#e8e8ec` |
| `--fg` | `#f4f4f5` | `#18181b` |
| `--muted` | `#a1a1ac` | `#52525b` |
| `--faint` | `#6c6c78` | `#8b8b95` |

### Vurgu — tek mor

| Token | Koyu | Açık |
|---|---|---|
| `--accent` | `#8b5cf6` | `#7c3aed` |
| `--accent-text` | `#c3aefc` | `#6d28d9` |
| `--accent-soft` | `#1d1630` | `#f3efff` |

İkinci bir marka rengi yok. Grafiklerdeki dil renkleri veri renkleridir,
vurgu rengi değildir.

### Durum renkleri
`--success` yalnızca pozitif delta, `--danger` negatif delta ve hata,
`--warning` dışlama/uyarı. **Kota göstergesinde yeşil kullanılmaz** — bkz. §6.

### Yarıçap ve gölge
`8 / 10 / 12 / 16 / 999px`. Kartlar `16px`, popover ve alan kontrolleri
`10–12px`. Tek gölge `--shadow-pop` vardır ve yalnızca yüzen katmanlarda
(popover, tooltip) kullanılır; kartlar hairline kenarlıkla ayrılır.

### Tipografi — Geist Sans, tanımlayıcılarda Geist Mono

| Sınıf | Boyut / satır | Kullanım |
|---|---|---|
| `.t-display` | 22 / 28, 600 | Sayfa başlığı, profil adı |
| `.t-title` | 16 / 24, 600 | Bölüm başlığı |
| `.t-body` | 14 / 21.6 | Gövde |
| `.t-small` | 13 / 20 | Kontrol ve liste metni |
| `.t-caption` | 12 / 17.6 | Yardımcı metin |
| `.t-micro` | 11 / 16, büyük harf, +4% aralık | Etiket |
| `.t-stat` | 24 / 28, 600, tabular | Metrik sayısı |

Bütün sayısal okumalar `.tnum` (tabular figür) kullanır. Repo adları,
kullanıcı adları ve token alanı mono'dur.

### Ritim
Bölümler arası `16px`, kart içi `16–20px`, grid boşluğu `12px`, header
yüksekliği `56px`. Yüksek yoğunluklu ama sıkışık olmayan bir düzen hedeflenir;
dekoratif boşluk ve dekoratif gölge yoktur.

### i18n
Her metin `src/lib/i18n.ts` üzerinden gelir — hata mesajları, giriş metinleri
ve boş durum metinleri dahil. Sunucu hata **kodu** döndürür (`rate_limit`,
`not_found`, …), çeviri istemcide seçilir. Sayı ve tarih biçimleri de
`useFormat()` ile aktif dile bağlıdır.

---

## 4. Mobil kırılım noktaları

| Genişlik | Davranış |
|---|---|
| `< 640` (base) | Tek kolon. Header: logo + arama + oturum. Dil/tema `SessionMenu` içine katlanır. Kota sayısı yalnızca alarm durumunda görünür. Alt sekme çubuğu açık (`h-56px` + safe-area). |
| `≥ 640` (`sm`) | Repo grid 2 kolon, metrikler 4 kolon. Dil ve tema header'a döner. Kota sayısı her durumda görünür. |
| `≥ 768` (`md`) | Alt sekme çubuğu kapanır, bölüm linkleri header'a taşınır. Footer görünür. Yatay iç boşluk `24px`. |
| `≥ 1024` (`lg`) | Dil DNA'sı donut + bar olarak iki kolona ayrılır. |
| `≥ 1280` (`xl`) | Repo grid 3 kolon; logo yanında kelime markası çıkar. |

İçerik genişliği her yerde `1200px` ile sınırlıdır. 375px'te yatay kaydırma
yoktur (doğrulandı).

---

## 5. Boş durum kuralları

- Bir satır başlık, en fazla bir satır açıklama, **tek aksiyon**.
- İkinci bir "daha fazla bilgi" linki, illüstrasyon veya emoji yok.
- Boş alan asla çıplak bırakılmaz: `EmptyState` kesikli çerçeveli bir kart
  döndürür.
- Yükleme sırasında boş ekran yerine gerçek düzenin iskeleti gösterilir
  (`AnalyzeSkeleton`, `Skeleton`).

| Yer | Başlık | Tek aksiyon |
|---|---|---|
| Analiz, hiç veri yok | örnek veri bandı | "Bir profil ara" (aramaya odaklanır) |
| Repo grid, filtre eşleşmedi | "Filtreye uyan repo yok" | "Filtreleri temizle" |
| İzleme, liste boş | "Henüz izlenen bir şey yok" | "Bir profil ara" |
| Karşılaştır, sonuç yok | "Karşılaştırma bekliyor" | — (aksiyon formun kendisi) |

---

## 6. Hata kuralları

Tek bir render yolu vardır: `ErrorNotice`. Sunucu makine-okunur `code`
döndürür, metin istemcide çevrilir.

| Kod | Ne zaman | Ton | Aksiyonlar |
|---|---|---|---|
| `not_found` | Kullanıcı/org/repo yok | danger | Tekrar dene |
| `bad_credentials` | Token reddedildi | warning | Giriş yap · Token ekle · Tekrar dene |
| `rate_limit` | Saatlik kota bitti | warning | Giriş yap · Token ekle · Tekrar dene |
| `bad_request` | Eksik parametre | danger | — |
| `network` | İstek tamamlanamadı | danger | Tekrar dene |
| `unknown` | Sınıflandırılamayan | danger | Tekrar dene |

Kurallar:

- **Elde veri varsa hata tam ekranı devralmaz.** Veri üstünde ince bir bant
  olarak görünür (`inline`), içerik okunur kalır.
- `rate_limit` geldiğinde son önbellek gösterilir; önbellek yoksa örnek veri.
- `rate_limit` header'daki kota okumasını geçersiz kılar
  (`QUOTA_STALE_EVENT`), böylece rozet "60/60" derken ekran "kota bitti"
  diyemez.
- "Token ekle" ayrı bir form açmaz; header'daki tek oturum popover'ını açar.

### Kota rozeti

`src/lib/quota.ts` tek kaynaktır ve **yeşil seviye tanımlamaz**; sağlıklı kota
nötr renktedir. Böylece "0 kalan ama yeşil" durumu ifade edilemez.

| Durum | Renk |
|---|---|
| Oturumlu, kota > %50 | nötr (muted) |
| Kota %20–50 | amber |
| Kota < %20 veya 0 | kırmızı + CTA |
| Anonim tavan (`limit ≤ 60`, yani `60/60`) | kırmızı + CTA |

Son satır bilinçli bir üründür: 60 istek tavanı tam görünse bile tek analizde
tükenir, çözümü de kota bittiğindekiyle aynı eylemdir.

---

## 7. Bilinçli olarak yapılmayanlar

- **Yinelenen arama kutusu yok.** Repo listesindeki metin alanı bir *filtre*
  alanıdır: filtre ikonu, filtre metni, ekrandaki listeyi daraltır.
- **"Genel Bakış" sayfası yok.** Eski Genel Bakış ile İzleme aynı işi iki yerde
  yapıyordu; Genel Bakış Analiz'in ilk açılış durumuna dönüştü.
- **Header'da tek kimlik/kota kontrolü var.** Giriş düğmesi, kota rozeti, token
  alanı ve PWA istemi tek popover'da.
- **"Fork gizle" anahtarı yok.** Analiz fork'ları sunucuda zaten dışarıda
  bırakıyor (`github.ts`, `allRepos.filter(r => !r.fork)`), dolayısıyla anahtar
  hiçbir şey yapmazdı. Yerine repo listesinde kalıcı bir not var.
