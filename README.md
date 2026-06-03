# Asrep (Analytics Report Tracker)

Asrep adalah aplikasi desktop berbasis **Tauri + React + TypeScript** yang dirancang untuk melacak, mengelola, dan menganalisis performa konten media sosial secara dinamis (Instagram dan TikTok). Aplikasi ini membantu kreator, manajer media sosial, dan analis untuk mencatat metrik utama (Views, Likes, Comments, Saves, Shares) dan memvisualisasikan tren performa dalam basis folder bulanan dan tahunan.

---

## 🎨 Design System: Google AI / Material Design 3

Aplikasi ini menggunakan bahasa desain **Google AI / Material You (Material Design 3)** yang modern, bersih, dan ekspresif.

### Fitur Desain Utama:
*   **Dual Theme (Light & Dark Mode)**: Mendukung tema gelap premium secara default (mengikuti preferensi sistem) yang dapat diubah secara instan melalui tombol toggle di sidebar.
*   **Google Sans Typography**: Menggunakan font bergaya humanist geometric yang bersih dengan kerning negatif tipis (`-0.01em`) untuk keterbacaan optimal.
*   **Glassmorphic Overlay**: Semua dialog modal menggunakan overlay latar belakang gelap dengan efek blur penuh (`backdrop-filter: blur(12px)`) yang halus dan stabil secara performa.
*   **Pill & Rounded Shapes**: Kelengkungan sudut yang konsisten (28px untuk dialog popup, 16px untuk kartu statistik) dan tombol berbentuk kapsul (pill-shaped).

---

## 🛠️ Tech Stack & Library

*   **Runtime/Desktop Shell**: [Tauri](https://tauri.app/) (Menggunakan backend Rust yang super cepat dan aman).
*   **Frontend Core**: [React](https://react.dev/) + Vite + TypeScript.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Tokens (di dalam [index.css](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/Asrep/src/index.css)).
*   **Charts & Visualisasi**: [Recharts](https://recharts.org/) (Line & Area charts dengan custom tooltip material).
*   **Icons**: [Lucide React](https://lucide.dev/).

---

## 📂 Struktur Folder Proyek

```text
Asrep/
├── src/
│   ├── components/
│   │   ├── MacSidebar.tsx       # Navigation Rail ala Google AI (Pill active indicator, import/export, profile edit)
│   │   ├── DashboardView.tsx    # Dashboard utama (Statistik card, grafik analitik, widget kalender)
│   │   ├── MonthFolderView.tsx  # Tabel data bulanan (Penyaringan pencarian, pengelompokan platform, aksi edit/hapus)
│   │   └── ContentPopup.tsx     # Form popup tambah/edit entri konten harian
│   ├── hooks/
│   │   └── useAppState.ts       # React hooks untuk pengelolaan state global
│   ├── utils/
│   │   └── initialState.ts      # Template data awal dan konfigurasi bulan/tahun
│   ├── App.tsx                  # Kontroler rute view utama dan dialog global
│   ├── types.ts                 # Definisi tipe data TypeScript (Konten, metrik, profile, state)
│   └── index.css                # Konfigurasi token CSS Google AI, keyframes, scrollbar, dan animasi
├── src-tauri/                   # Konfigurasi Rust dan native build Tauri
├── package.json                 # Dependensi npm dan script build
└── tsconfig.json                # Konfigurasi kompiler TypeScript
```

---

## 📊 Skema Data Utama (`types.ts`)

Aplikasi mengelola data konten harian yang mencakup metrik untuk kedua platform secara bersamaan dalam satu entri:

```typescript
export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
}

export interface ContentEntry {
  id: string;
  day: number; // Tanggal postingan (1-31)
  title: string; // Judul/Topik Konten
  instagram: ContentMetrics;
  tiktok: ContentMetrics;
}

export interface PlatformProfile {
  username: string;
  fullName: string;
  followers: number;
}
```

---

## 🚀 Panduan Memulai & Menjalankan Proyek

### Prasyarat
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org/) (versi 18+)
*   [Rust](https://www.rust-lang.org/) (diperlukan untuk Tauri compiler)

### 1. Instalasi Dependensi
Jalankan perintah berikut di terminal untuk mengunduh modul node:
```bash
npm install
```

### 2. Jalankan Mode Pengembangan (Development)
Untuk menjalankan aplikasi desktop dalam mode *hot-reload*:
```bash
npm run tauri dev
# atau
npx tauri dev
```

### 3. Build Aplikasi untuk Produksi (Bundler Desktop)
Untuk membundel aplikasi menjadi aplikasi desktop native (.app untuk macOS, .exe untuk Windows, .deb untuk Linux):
```bash
npm run tauri build
# atau
npx tauri build
```

---

## ⚡ Fitur Utama Aplikasi

1.  **Dashboard Analytics**:
    *   **Metric Cards**: Menampilkan total Views, Engagement Rate, FYP Hits (postingan di atas 20k views), serta perbandingan distribusi performa IG vs TikTok.
    *   **Growth Badges**: Indikator pertumbuhan naik/turun berwarna hijau/merah dengan ikon tren.
    *   **Interactive Charts**: Grafik area interaktif untuk tren mingguan, tren bulanan, dan visualisasi interaksi (Likes/Comments/Saves/Shares).
    *   **Calendar Schedule**: Widget kalender yang melingkari tanggal yang memiliki postingan aktif.
2.  **Folder-Based Management**:
    *   Mengelompokkan konten berdasarkan Tahun -> Bulan (Januari - Desember).
    *   Menambah/menghapus Folder Tahun secara dinamis langsung dari sidebar.
3.  **Data Table & Search**:
    *   Menampilkan data detail postingan bulanan.
    *   Fitur pencarian instan berdasarkan judul konten.
    *   Filter pengelompokan berdasarkan platform (Semua, Instagram saja, TikTok saja).
4.  **Import & Export Data**:
    *   Mengekspor seluruh database aplikasi ke dalam satu file JSON lokal.
    *   Mengimpor kembali database JSON untuk melakukan sinkronisasi data antar perangkat.
