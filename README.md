# NimeStream 🌌

NimeStream adalah platform website streaming anime modern berkinerja tinggi yang melakukan **scraping data secara realtime** dari [Otakudesu](https://otakudesu.blog/). Dibangun menggunakan **Next.js App Router** dan dirancang secara visual dengan tema **Candy Dark Mode** yang premium, futuristik, dan responsif.

---

## ✨ Fitur Utama

- 🏠 **Beranda Interaktif**: Banner utama dinamis Rory Mercury, serta daftar grid anime *On-Going* (sedang tayang) dan *Completed* (tamat).
- 📅 **Jadwal Rilis Mingguan**: Menampilkan daftar rilis harian anime dari Senin sampai Minggu.
- 🔠 **Indeks Anime A-Z**: Navigasi alfabetik instan untuk mencari judul anime favorit Anda.
- 🏷️ **Daftar & Filter Genre**: Telusuri anime berdasarkan genre/kategori dengan sistem paginasi yang rapi.
- 🎥 **Video Stream Switcher**: Pemutar video dinamis dengan fitur pergantian mirror server (DesuUpload, StreamSB, dll.) secara *client-side*.
- 📥 **Unduh Episode & Batch**: Link download langsung terstruktur per episode beserta link download Batch lengkap untuk mengunduh semua episode sekaligus.
- 🌐 **Domain-Change Ready**: Dikonfigurasi secara dinamis untuk memudahkan perubahan domain Otakudesu melalui file konfigurasi tanpa menyentuh source code inti.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (React)](https://nextjs.org/)
- **Scraper Engine**: [Cheerio](https://cheerio.js.org/) (Realtime HTML Parsing)
- **Styling**: Vanilla CSS (kustom, tanpa framework utility eksternal untuk kontrol performa penuh)
- **Rute API**: Next.js Route Handlers (Backend API endpoints)

---

## 🚀 Cara Menjalankan Project secara Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/username/nimestream.git
cd nimestream
```

### 2. Instal Dependency
Pastikan Anda sudah menginstal Node.js versi terbaru (direkomendasikan v18+).
```bash
npm install
```

### 3. Konfigurasi Domain Scraper (Opsional)
Salin atau edit file `.env.local` pada direktori root untuk menyesuaikan domain Otakudesu:
```env
NEXT_PUBLIC_OTAKUDESU_URL=https://otakudesu.blog
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda dan akses di [http://localhost:3003](http://localhost:3003).

### 5. Build untuk Produksi
```bash
npm run build
npm run start
```

---

## 📁 Struktur Direktori Penting

```text
├── app/                  # Direktori utama Next.js (App Router)
│   ├── api/              # Route Handlers backend untuk scraper endpoint
│   ├── anime/            # Halaman detail anime
│   ├── anime-list/       # Halaman daftar anime alfabetikal
│   ├── batch/            # Halaman download batch
│   ├── episode/          # Halaman nonton video streaming & download
│   ├── genre-list/       # Halaman kategori genre
│   ├── genres/           # Halaman daftar anime per genre (paginated)
│   ├── jadwal-rilis/     # Halaman jadwal rilis mingguan
│   └── ongoing-anime/    # Halaman list ongoing anime (paginated)
├── components/           # Komponen reusable frontend (Header, AnimeGrid, Player)
├── lib/                  # Logika core scraper & fetch helper (scraper.js)
├── public/               # File statik & gambar aset banner
└── globals.css           # Desain kustom Candy Dark Mode
```

---

## ⚠️ Disclaimer
Project ini dibuat hanya untuk tujuan edukasi dan pembelajaran teknik *web scraping*. Seluruh hak cipta konten anime dan media sepenuhnya milik sumber asli (Otakudesu) dan pemilik lisensi masing-masing.
