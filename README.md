# NimeStream 🌌

NimeStream adalah platform website streaming anime modern berkinerja tinggi yang melakukan **scraping data secara realtime** dari [Otakudesu](https://otakudesu.blog/) dan mengintegrasikan link download batch dari [Kusonime](https://kusonime.com/). Dibangun menggunakan **Next.js App Router** 

---

## ✨ Fitur Utama

- 🏠 **Beranda Interaktif**: Daftar grid anime *On-Going* (sedang tayang), *Completed* (tamat), dan *Kusonime Batch* terbaru.
- 📅 **Jadwal Rilis Mingguan**: Menampilkan daftar rilis harian anime terintegrasi langsung dengan **AniList API** untuk pencocokan jam WIB otomatis.
- 🔠 **Indeks Anime A-Z**: Navigasi alfabetik terpadu yang menggabungkan database anime Otakudesu dan Kusonime dengan sistem deduplikasi judul.
- 🏷️ **Daftar & Filter Genre**: Telusuri anime berdasarkan genre/kategori dengan sistem paginasi yang rapi.
- 🎥 **Video Stream Switcher**: Pemutar video dinamis dengan fitur pergantian mirror server secara *client-side*.
- 📥 **Unduh Episode & Batch**: Link download terstruktur per episode beserta block tabel link download **Batch (Kusonime & Otakudesu)** langsung di halaman detail anime.
- 🕒 **Watch History (Riwayat Tontonan)**: 
  * Perekaman otomatis episode terakhir yang baru saja ditonton dengan meng-query cover anime resmi berformat portrait.
  * Halaman khusus `/riwayat` lengkap dengan pembersihan instan dan hapus satuan.
  * Banner **"Lanjutkan Menonton"** di halaman depan (Home) berformat grid portrait sejajar.
- 🟢 **Real-time Online Counter**: Widget premium pada Header untuk memantau jumlah user aktif yang sedang membuka situs secara real-time.
- 🌐 **Domain-Change Ready**: Dikonfigurasi secara dinamis untuk memudahkan perubahan domain asal melalui file `.env.local`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (React)](https://nextjs.org/)
- **Scraper Engine**: [Cheerio](https://cheerio.js.org/) (Realtime HTML Parsing)
- **Database Schedule & Time**: [AniList GraphQL API](https://anilist.co/)
- **Client Storage**: HTML5 `localStorage` (Watch History Cache)
- **Styling**: Vanilla CSS (kustom Candy Dark Mode, interaksi mikro-animasi premium)
- **Rute API**: Next.js Route Handlers (Backend API endpoints untuk heartbeat online counter dan scraper data)

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
NEXT_PUBLIC_KUSONIME_ENABLED=true
NEXT_PUBLIC_KUSONIME_URL=https://kusonime.com
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
│   ├── api/              # Route Handlers (Scraper Otakudesu/Kusonime & Heartbeat Online Counter)
│   ├── anime/            # Halaman detail anime (Menampilkan link batch terintegrasi)
│   ├── anime-list/       # Halaman daftar anime alfabetikal gabungan + deduplikasi
│   ├── batch/            # Halaman download batch Otakudesu & Kusonime
│   ├── batch-list/       # Halaman list batch terbaru dengan Page Navigator lengkap
│   ├── episode/          # Halaman nonton video streaming & download (dilengkapi auto watch tracker)
│   ├── genre-list/       # Halaman kategori genre
│   ├── genres/           # Halaman daftar anime per genre (paginated)
│   ├── jadwal-rilis/     # Halaman jadwal rilis mingguan dengan jam tayang AniList
│   └── riwayat/          # Halaman daftar riwayat tontonan user lokal
├── components/           # Komponen reusable (Header, OnlineUsersCounter, ResumeWatchingBlock)
├── lib/                  # Logika core scraper (scraper.js, kusonimeScraper.js)
├── public/               # File statik & gambar aset logo
└── globals.css           # Desain kustom Candy Dark Mode & mikro-animasi
```


---

## ⚠️ Disclaimer
Project ini dibuat hanya untuk tujuan edukasi dan pembelajaran teknik *web scraping*. Seluruh hak cipta konten anime dan media sepenuhnya milik sumber asli (Otakudesu, Kusonime, & AniList) dan pemilik lisensi masing-masing.
