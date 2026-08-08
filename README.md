# NimeStream 🌌

NimeStream adalah platform website streaming anime modern berkinerja tinggi yang melakukan **scraping data secara realtime** dari **Otakudesu**, **Kusonime**, dan **Oploverz**. Dibangun menggunakan **Next.js App Router**.

---

## ✨ Fitur Utama

- 🏠 **Beranda Interaktif**: Daftar grid anime *On-Going* (sedang tayang), *Completed* (tamat), dan *Batch* terbaru yang terintegrasi secara mulus.
- 🔀 **Deduplikasi Cerdas (Consolidation)**: Menggabungkan data anime dari berbagai sumber secara pintar (fuzzy matching). Judul anime yang sama tidak akan muncul dobel di beranda atau pencarian, melainkan disatukan dalam satu halaman dengan opsi mirror multi-source.
- 📅 **Jadwal Rilis Mingguan**: Menampilkan daftar rilis harian anime terintegrasi langsung dengan **AniList API** untuk pencocokan jam WIB otomatis.
- 🔠 **Indeks Anime A-Z**: Navigasi alfabetik terpadu yang menggabungkan database anime Otakudesu dan Kusonime dengan sistem deduplikasi judul.
- 🎥 **Video Stream Switcher**: Pemutar video dinamis dengan fitur pergantian mirror server secara *client-side* dari multi-source.
- 📥 **Unduh Episode & Batch**: Link download terstruktur per episode beserta block tabel link download **Batch** langsung di halaman detail anime.
- 🕒 **Watch History (Riwayat Tontonan)**: Perekaman otomatis episode terakhir yang baru saja ditonton dengan cover portrait premium dan banner **"Lanjutkan Menonton"** di beranda.
- 🔖 **Watchlist / Bookmark Lokal**: Fitur penanda buku untuk menyimpan anime favorit langsung di browser menggunakan `localStorage` tanpa perlu database.
- 🎭 **Smart Recommendations**: Rekomendasi anime serupa di bagian bawah halaman detail berdasarkan kecocokan irisan genre & kesamaan judul.
- ⚡ **JSON File Cache Jangka Panjang**: Mengganti cache memori RAM menjadi cache disk file JSON lokal (`tmp/ns-cache/`) untuk ongoing, genres, dan anime list. Mengurangi konsumsi RAM Node.js hingga **100MB+**, sangat ramah untuk VPS/SBC mini (Orange Pi, Raspberry Pi).
- 🟢 **Real-time Online Counter**: Widget premium pada Header untuk memantau jumlah user aktif yang sedang membuka situs secara real-time.
- 🌐 **Domain-Change Ready**: Dikonfigurasi secara dinamis untuk memudahkan perubahan domain asal & API domain melalui file `.env.local`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (React)](https://nextjs.org/)
- **Scraper Engine**: [Cheerio](https://cheerio.js.org/) (Realtime HTML Parsing & XHR JSON Client requests)
- **Database Schedule & Time**: [AniList GraphQL API](https://anilist.co/)
- **Client Storage**: HTML5 `localStorage` (Watch History & Watchlist Bookmark Cache)
- **Styling**: Vanilla CSS (kustom Candy Dark Mode, interaksi mikro-animasi premium)
- **Rute API**: Next.js Route Handlers (Backend API endpoints untuk heartbeat online counter, proxy gambar bypass referer hotlink, dan scraper data)

---

## 🚀 Cara Menjalankan Project secara Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/irnhakim/nimestream.git
cd nimestream
```

### 2. Instal Dependency
Pastikan Anda sudah menginstal Node.js versi terbaru (direkomendasikan v18+).
```bash
npm install
```

### 3. Konfigurasi File Environment
Salin atau edit file `.env.local` pada direktori root untuk menyesuaikan domain sumber:
```env
NEXT_PUBLIC_OTAKUDESU_URL=https://otakudesu.blog

# Konfigurasi Kusonime (Opsional)
NEXT_PUBLIC_KUSONIME_ENABLED=true
NEXT_PUBLIC_KUSONIME_URL=https://kusonime.com

# Konfigurasi Oploverz (Opsional)
NEXT_PUBLIC_OPLOVERZ_ENABLED=true
NEXT_PUBLIC_OPLOVERZ_API_URL=https://backapi.oploverz.ac/api

# Konfigurasi Alqanime (Opsional)
NEXT_PUBLIC_ALQANIME_ENABLED=false
NEXT_PUBLIC_ALQANIME_URL=https://alqanime.net

# Konfigurasi 11+ Platform Tambahan (Dapat Diaktifkan Sesuai Kebutuhan)
NEXT_PUBLIC_SAMEHADAKU_ENABLED=false
NEXT_PUBLIC_SAMEHADAKU_URL=https://v1.samehadaku.how
NEXT_PUBLIC_DONGHUA_ENABLED=false
NEXT_PUBLIC_DONGHUA_URL=https://anichin.cafe
NEXT_PUBLIC_ANIMASU_ENABLED=false
NEXT_PUBLIC_ANIMASU_URL=https://v1.animasu.top
# (Lihat file .env.local untuk daftar lengkap 18 variabel platform lainnya)
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda dan akses di [http://localhost:3006](http://localhost:3006).

### 5. Build untuk Produksi
```bash
npm run build
```

---

## 📁 Struktur Direktori Penting

```text
├── app/                  # Direktori utama Next.js (App Router)
├── components/           # Komponen reusable (Header, BookmarkButton, PageProgressBar, OnlineUsersCounter)
├── lib/                  # Logika core scraper (scraper.js, kusonimeScraper.js, oploverzScraper.js, fileCache.js)
├── public/               # File statik & gambar aset logo
├── scratch/              # Script debug (Diabaikan oleh git)
└── globals.css           # Desain kustom Candy Dark Mode & mikro-animasi
```


---

## ⚠️ Disclaimer
Project ini dibuat hanya untuk tujuan edukasi dan pembelajaran teknik *web scraping*. Seluruh hak cipta konten anime dan media sepenuhnya milik sumber asli (Otakudesu, Kusonime, & AniList) dan pemilik lisensi masing-masing.
