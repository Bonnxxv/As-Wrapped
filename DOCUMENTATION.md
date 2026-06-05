# Dokumentasi Proyek: As-Wrapped (Analytics Report Tracker)

Dokumentasi ini menyajikan rincian teknis menyeluruh mengenai proyek **As-Wrapped**, mencakup arsitektur sistem, skema data, manajemen state, desain UI/UX, dan panduan operasional proyek.

---

## Daftar Isi
1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Tech Stack & Prasyarat](#2-tech-stack--prasyarat)
3. [Arsitektur & Struktur Direktori](#3-arsitektur--struktur-direktori)
4. [Skema Data (`types.ts`)](#4-skema-data-typests)
5. [Manajemen State Global (`useAppState.ts`)](#5-manajemen-state-global-useappstatets)
6. [Integrasi Backend Rust & Tauri](#6-integrasi-backend-rust--tauri)
7. [Penjelasan Komponen Frontend](#7-penjelasan-komponen-frontend)
8. [Design System & Styling (`index.css`)](#8-design-system--styling-indexcss)
9. [Riwayat Refactoring & Migrasi (Asrep ke As-Wrapped)](#9-riwayat-refactoring--migrasi-asrep-ke-as-wrapped)
10. [Panduan Menjalankan & Membangun Proyek](#10-panduan-menjalankan--membangun-proyek)

---

## 1. Ringkasan Proyek

**As-Wrapped** (sebelumnya dikenal sebagai **Asrep**) adalah aplikasi desktop lintas platform yang dirancang khusus untuk mempermudah pembuat konten (*creators*), manajer media sosial, dan tim pemasaran dalam melacak, menganalisis, dan memvisualisasikan performa konten mereka di Instagram dan TikTok secara bulanan dan tahunan.

Aplikasi ini beroperasi sepenuhnya secara lokal (*offline-first*), menyimpan data langsung pada penyimpanan lokal pengguna (Local Storage & direktori dokumen untuk pencadangan). Hal ini memastikan keamanan data privasi pengguna serta performa aplikasi yang sangat cepat tanpa beban latensi server.

---

## 2. Tech Stack & Prasyarat

### Core Stack
*   **Desktop Shell / Runtime**: [Tauri v2](https://tauri.app/) - Mengemas frontend web ke dalam aplikasi desktop native menggunakan webview bawaan OS dengan backend Rust yang ringan dan aman.
*   **Frontend Library**: [React 19](https://react.dev/) - Library JavaScript untuk membangun antarmuka pengguna berbasis komponen.
*   **Bahasa Pemrograman**: [TypeScript](https://www.typescriptlang.org/) - Menjamin keamanan tipe (*type safety*) di seluruh bagian frontend.
*   **Build Tool**: [Vite 7](https://vite.dev/) - Bundler frontend ultra cepat untuk development hot-reload dan optimalisasi produksi.

### Library Utama & Pendukung
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) bersama dengan custom tokens Material Design 3.
*   **Visualisasi Grafik**: [Recharts](https://recharts.org/) - Digunakan untuk membuat grafik tren performa interaktif (Area & Line Chart).
*   **Icons**: [Lucide React](https://lucide.dev/) - Koleksi ikon modern.
*   **Helper**: `patch_dashboard.cjs` - Skrip Node.js kustom untuk otomatisasi patching komponen dashboard selama refactoring.

### Prasyarat Pengembangan (Development Prerequisites)
1.  **Node.js**: Versi 18 ke atas (disarankan versi LTS terbaru).
2.  **Rust & Cargo**: Diperlukan untuk kompilasi kode native Tauri. Pasang via [Rustup](https://rustup.rs/).
3.  **OS Build Tools**:
    *   *macOS*: Xcode Command Line Tools (`xcode-select --install`).
    *   *Windows*: C++ Build Tools melalui Visual Studio Installer.
    *   *Linux*: Paket sistem dasar seperti `webkit2gtk`, `libsoup`, dan `build-essential`.

---

## 3. Arsitektur & Struktur Direktori

Berikut adalah pohon direktori lengkap proyek **As-Wrapped**:

```text
As-Wrapped/
├── package.json                 # Konfigurasi dependensi Node.js & script pemicu
├── package-lock.json            # Lockfile dependensi npm
├── tsconfig.json                # Konfigurasi TypeScript untuk frontend
├── tsconfig.node.json           # Konfigurasi TypeScript khusus untuk lingkungan node (Vite config, dll)
├── vite.config.ts               # Konfigurasi bundler Vite (plugin react, port dev server)
├── postcss.config.js            # Konfigurasi postcss
├── tailwind.config.js           # Konfigurasi kustom Tailwind CSS
├── patch_dashboard.cjs          # Skrip kustom Node.js untuk refactoring otomatis DashboardView
├── index.html                   # Entry point dokumen HTML utama
├── dist/                        # Direktori output build frontend (dibuat setelah build)
├── public/                      # Aset publik statis (logo, gambar non-dinamis)
├── src-tauri/                   # Sisi Backend aplikasi (Rust & Konfigurasi Tauri)
│   ├── Cargo.toml               # Dependensi cargo untuk library Rust
│   ├── Cargo.lock               # Lockfile Cargo Rust
│   ├── build.rs                 # Script build Tauri otomatis
│   ├── tauri.conf.json          # Konfigurasi window, keamanan, ikon, dan bundler Tauri
│   ├── capabilities/            # Hak akses aplikasi (izin native file system/opener)
│   └── src/
│       ├── main.rs              # Titik masuk eksekusi biner
│       └── lib.rs               # Implementasi modul Rust & tauri command handlers
└── src/                         # Sisi Frontend aplikasi (React + TS)
    ├── App.tsx                  # Controller routing tampilan utama, dialog global, dan notifikasi
    ├── main.tsx                 # Entry point inisialisasi React ke DOM
    ├── types.ts                 # Definisi tipe TypeScript global proyek
    ├── index.css                # Desain sistem Google AI, warna variabel, M3 keyframes, dan tombol kustom
    ├── vite-env.d.ts            # Tipe lingkungan Vite
    ├── components/              # Komponen antarmuka pengguna (UI Components)
    │   ├── MacSidebar.tsx       # Sidebar navigasi ala macOS Sequoia & M3
    │   ├── DashboardView.tsx    # Dashboard analisis data, visualisasi Recharts, dan kalender
    │   ├── MonthFolderView.tsx  # Tabel pengelolaan data bulanan (view, edit, delete)
    │   ├── ContentPopup.tsx     # Popup form terpadu tambah/edit data konten harian
    │   └── MacDropdown.tsx      # Komponen dropdown material kustom
    ├── hooks/
    │   └── useAppState.ts       # React hooks pengelola state global & integrasi Tauri backup command
    └── utils/
        └── initialState.ts      # Template data tiruan awal (mock data) dan helper tanggal
```

---

## 4. Skema Data (`types.ts`)

File [types.ts](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/types.ts) menetapkan tipe data kuat yang digunakan di seluruh aplikasi. Di versi As-Wrapped terbaru, struktur data disederhanakan sehingga satu entri harian (`ContentEntry`) merekam metrik untuk Instagram dan TikTok secara langsung dalam waktu bersamaan.

```typescript
// Platform Type
export type PlatformType = 'instagram' | 'tiktok';

// Skema Metrik Konten
export interface ContentMetrics {
  views: number;      // Jumlah tayangan video
  likes: number;      // Jumlah suka/reaksi
  comments: number;   // Jumlah komentar
  saves: number;      // Jumlah simpan (Instagram Bookmark / TikTok Favorite)
  shares: number;     // Jumlah bagikan/repost
}

// Skema Entri Konten Utama
export interface ContentEntry {
  id: string;               // UUID unik buatan frontend
  day: number;              // Tanggal publikasi (1 - 28/29/30/31)
  title: string;            // Topik atau judul utama konten
  instagram: ContentMetrics;// Metrik Instagram (views, likes, dll.)
  tiktok: ContentMetrics;   // Metrik TikTok (views, likes, dll.)
}

// Profil Akun Platform
export interface PlatformProfile {
  username: string;         // Username media sosial (tanpa '@')
  fullName: string;         // Nama lengkap / nama tampilan profil
  followers: number;        // Jumlah pengikut aktif saat ini
}

// Peta Profil untuk Kedua Platform
export interface PlatformProfiles {
  instagram: PlatformProfile;
  tiktok: PlatformProfile;
}

// Struktur Data Folder Berbasis Tahun -> Indeks Bulan (0-11) -> Daftar Entri Konten
export type FolderDataState = Record<number, Record<number, ContentEntry[]>>;

// Representasi State Global Aplikasi
export interface AppState {
  years: number[];            // Daftar tahun yang didaftarkan (misal: [2024, 2025, 2026])
  folders: FolderDataState;   // Seluruh database entri konten terkelompok
  profiles: PlatformProfiles; // Informasi akun media sosial pengikut
}
```

---

## 5. Manajemen State Global (`useAppState.ts`)

Seluruh business logic aplikasi dikelola di dalam file [useAppState.ts](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/hooks/useAppState.ts). Hook kustom ini mengontrol pembaruan data, validasi, persistensi otomatis ke Local Storage, konversi data lama, serta operasi ekspor/impor cadangan JSON.

### Konstanta Penyimpanan (Local Storage Keys)
Aplikasi mendukung penggunaan kunci lama (**Asrep**) dan kunci baru (**As-Wrapped**), dan secara otomatis menyalin kunci lama ke baru demi mencegah hilangnya data pengguna setelah migrasi.
*   `YEARS_STORAGE_KEY` = `'aswrapped_years_data'` (Kunci cadangan lama: `'asrep_years_data'`)
*   `FOLDERS_STORAGE_KEY` = `'aswrapped_folders_data'` (Kunci cadangan lama: `'asrep_folders_data'`)
*   `PROFILES_STORAGE_KEY` = `'aswrapped_profiles_data'` (Kunci cadangan lama: `'asrep_profiles_data'`)

### Fungsi Utama State Manager

#### 1. Migrasi Data (`migrateFoldersData` & `migrateProfilesData`)
Berfungsi untuk memvalidasi struktur JSON saat aplikasi memuat state dari Local Storage atau file cadangan eksternal.
- Jika data dalam format skema lama (misal: format Asrep di mana setiap item hanya memiliki satu bidang `.platform` dan metrik datar seperti `.views`), fungsi ini mendeteksi platformnya dan memetakannya ke objek bersarang baru (`instagram` atau `tiktok`).
- Menjamin tidak ada data rusak atau hilang dengan menerapkan nilai default `{ views: 0, likes: 0, comments: 0, saves: 0, shares: 0 }` jika metrik kosong.

#### 2. Modifikasi Data Konten (`addContent`, `editContent`, `deleteContent`)
- `addContent(year, monthIndex, entry)`: Menghasilkan ID unik `content-[timestamp]-[random_string]`, menyisipkan entri ke dalam tahun dan bulan yang dipilih, serta mengurutkan urutan baris berdasarkan tanggal publikasi secara menaik (`a.day - b.day`).
- `editContent(year, monthIndex, id, entry)`: Mencari entri berdasarkan ID-nya, menimpa data metrik/judul, dan mengurutkan ulang list.
- `deleteContent(year, monthIndex, id)`: Menghapus entri tertentu berdasarkan ID-nya dari memori state.

#### 3. Manajemen Folder Tahun (`addYear`, `deleteYear`)
- `addYear(year)`: Mendaftarkan tahun baru ke dalam array `years` (diurutkan secara menaik) dan langsung menginisialisasi 12 bulan kosong (indeks 0 sampai 11) di dalam `folders` agar tidak menyebabkan error *undefined* saat diakses di antarmuka.
- `deleteYear(year)`: Menghapus tahun beserta seluruh folder bulanan yang bersarang di dalamnya.

#### 4. Pembaruan Profil (`updateProfile`)
Memperbarui informasi `username`, `fullName`, dan jumlah `followers` untuk platform Instagram atau TikTok.

#### 5. Ekspor Data (`exportData`)
Mengekspor seluruh basis data (`years`, `profiles`, `folders`) ke format JSON.
- Jika aplikasi berjalan di lingkungan Tauri (desktop native), hook memanggil Tauri Command API untuk memicu backend Rust (`save_backup_file`) agar menyimpan data langsung ke sistem dokumen pengguna.
- Jika aplikasi dijalankan di web browser biasa, fallback menggunakan URL Blob sementara untuk mengunduh file `.json` langsung ke folder unduhan pengguna secara aman.

#### 6. Impor Data (`importData`)
Membaca file `.json` yang dipilih oleh pengguna melalui objek `FileReader`.
- Memvalidasi isi berkas untuk memastikan ketersediaan format tahun, profil, dan data folder.
- Melakukan konversi struktur data lama ke skema baru jika diperlukan menggunakan fungsi migrasi yang sama, lalu memperbarui state aktif dan menyimpannya di Local Storage.

---

## 6. Integrasi Backend Rust & Tauri

Sisi native desktop diimplementasikan di dalam [lib.rs](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src-tauri/src/lib.rs) dengan memanfaatkan kerangka kerja Tauri v2.

### Implementasi Rust Commands

#### 1. `greet(name: &str) -> String`
Command sederhana untuk pengujian integrasi komunikasi IPC (Inter-Process Communication).

#### 2. `save_backup_file(app: tauri::AppHandle, content: String, filename: String) -> Result<String, String>`
Command backend utama yang menangani pencadangan data ke direktori penyimpanan native perangkat:
- Mengambil path folder dokumen pengguna secara aman menggunakan `app.path().document_dir()`.
- Membuat direktori khusus bernama **"As-Wrapped Backups"** jika direktori tersebut belum ada.
- Menuliskan konten JSON string ke file cadangan menggunakan `std::fs::File` dan menulis data menggunakan `file.write_all(content.as_bytes())`.
- Mengembalikan string path absolut penyimpanan file agar frontend dapat menampilkan pesan konfirmasi detail path kepada pengguna melalui snackbar.

```rust
#[tauri::command]
fn save_backup_file(app: tauri::AppHandle, content: String, filename: String) -> Result<String, String> {
    // Mendapatkan folder Documents pengguna
    let mut path = app.path().document_dir()
        .map_err(|e| format!("Gagal mendapatkan folder Documents: {}", e))?;
    
    // Membuat subfolder "As-Wrapped Backups" agar terorganisir
    path.push("As-Wrapped Backups");
    if !path.exists() {
        std::fs::create_dir_all(&path)
            .map_err(|e| format!("Gagal membuat folder cadangan: {}", e))?;
    }
    
    path.push(&filename);
    
    // Menulis konten cadangan
    let mut file = File::create(&path)
        .map_err(|e| format!("Gagal membuat file backup: {}", e))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Gagal menulis data ke file: {}", e))?;
    
    let path_str = path.to_string_lossy().to_string();
    Ok(path_str)
}
```

### Inisialisasi Aplikasi Tauri
Aplikasi mendaftarkan handler command ke pembangun Tauri utama pada fungsi `run()`:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_backup_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 7. Penjelasan Komponen Frontend

### 1. [App.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/App.tsx)
Berfungsi sebagai pengontrol rute, pemicu tema, manajemen modal global, dan pemberitahuan (Snackbar / Toast).
*   **Routing**: Memutuskan apakah yang harus dimuat adalah [DashboardView.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/DashboardView.tsx) atau [MonthFolderView.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/MonthFolderView.tsx) berdasarkan properti `activeView` dari sidebar.
*   **Dynamic Dates**: Mengidentifikasi tanggal saat ini berdasarkan jam sistem pengguna untuk mengarahkan pilihan bulan & tahun default awal.
*   **Dialog Deletion Warning Custom**: Menampilkan pop-up dialog konfirmasi berbasis Material Design 3 saat pengguna berniat menghapus entri konten atau folder tahunan tertentu, mencegah penghapusan tidak sengaja.
*   **Snackbar**: Menampilkan notifikasi melayang yang interaktif di bawah tengah layar dengan transisi masuk yang halus, digunakan untuk mengabarkan keberhasilan/kegagalan impor, ekspor, dan aksi lainnya.

### 2. [MacSidebar.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/MacSidebar.tsx)
Bilah navigasi samping yang mengadopsi elemen visual macOS Sequoia dan rel navigasi Material You (M3).
*   **Fitur Utama**:
    *   *Collapse / Expand*: Dapat diciutkan menjadi lebar minimal 64px untuk memaksimalkan area kerja konten utama, menampilkan ikon dengan tooltip yang rapi.
    *   *Custom Platform Icons*: Komponen SVG bawaan mandiri untuk ikon Instagram (dengan radial gradient) dan ikon TikTok (dengan efek offset 3-warna cyan/magenta) yang dirancang agar memiliki beban visual yang seimbang dengan ikon Lucide.
    *   *Platform Profile Editing*: Menyediakan pop-up pengeditan nama pengguna (*username*), nama lengkap, dan jumlah pengikut untuk kedua platform secara terpisah.
    *   *System Action Hub*: Bagian menu yang memuat tombol ganti tema gelap/terang, impor, dan ekspor data cadangan JSON.
    *   *Tahun & Bulan Folder Nesting*: Navigasi daftar tahun dinamis yang bisa di-expand untuk mengakses folder bulan (Januari - Desember) secara individual.

### 3. [DashboardView.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/DashboardView.tsx)
Pusat analitik yang menyajikan visualisasi data yang menakjubkan.
*   **Fitur Analitik**:
    *   *Period Filtering*: Pengguna dapat menyaring data berdasarkan durasi Bulan, Kuartal (Q1-Q4), atau Tahun.
    *   *Metric Cards*: Kartu informasi performa (Views, Uploads, Engagement, FYP Hits) yang dilengkapi dengan persentase pertumbuhan dibanding periode sebelumnya (*MoM* atau *YoY*).
    *   *Interactive Chart Visualizations (Recharts)*:
        *   **Grafik Tren Bulanan Gabungan**: Menampilkan garis visualisasi pertumbuhan tayangan di sepanjang tahun.
        *   **Grafik Perbandingan Platform**: Membandingkan kontribusi performa views Instagram vs TikTok secara visual dengan pewarnaan garis kustom.
        *   **Grafik Analitik Harian**: Rincian performa views harian dari hari ke-1 sampai hari terakhir bulan berjalan.
        *   **Grafik Siklus Mingguan**: Menampilkan performa konten berdasarkan hari dalam seminggu (Senin - Minggu) untuk mengidentifikasi hari terbaik mengunggah konten pada minggu tertentu.
    *   *Calendar Widget*: Kalender visual bulanan yang menandai tanggal-tanggal di mana pengguna mempublikasikan postingan konten secara aktif dengan latar belakang lingkaran berwarna biru.
    *   *Best Content Leaderboard*: Menampilkan daftar konten dengan performa views terbaik sepanjang bulan terpilih.
    *   *Modal Sequoia Dialog*: Memicu dialog pop-up yang diperluas untuk visualisasi grafik atau rincian kartu metrik secara detail.

### 4. [MonthFolderView.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/MonthFolderView.tsx)
Tampilan lembar data bulanan dalam format tabel terstruktur.
*   **Fitur Utama**:
    *   *Live Search*: Memungkinkan pengguna menyaring data tabel secara instan berdasarkan judul atau topik konten.
    *   *Group Filtering Chips*: Pilihan pengelompokan baris data berdasarkan kriteria: Semua Konten, Instagram Aktif, TikTok Aktif, atau FYP Hits (views > 20K).
    *   *Tabel Dinamis Berpasangan*: Baris tabel menampilkan metrik lengkap untuk Instagram dan TikTok secara bertumpuk jika kedua platform aktif, lengkap dengan lencana (badge) penanda pencapaian FYP berwarna kuning keemasan.

### 5. [ContentPopup.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/ContentPopup.tsx)
Pop-up dialog terpadu untuk menambah entri konten baru atau mengubah data yang sudah ada.
*   **M3 Switch & Mirroring**:
    *   Menyediakan tombol switch M3 untuk mengaktifkan atau menonaktifkan pelacakan platform tertentu (misalnya, hanya mengunggah konten di TikTok).
    *   Menyediakan fitur **Mirroring** (Salin metrik) sekali klik yang mempermudah pengguna untuk menduplikasi nilai metrik dari Instagram ke TikTok atau sebaliknya.
    *   Setiap input angka metrik secara otomatis membuang angka nol awal (*leading zero*) saat difokuskan demi kenyamanan pengetikan pengguna.

### 6. [MacDropdown.tsx](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/components/MacDropdown.tsx)
Komponen pemilih (select option) khusus dengan animasi buka/tutup berbasis transisi *scaleY* dan *opacity* halus yang disesuaikan dengan kurva pelambatan standar Material Design 3.

---

## 8. Design System & Styling (`index.css`)

Bahasa desain aplikasi **As-Wrapped** sepenuhnya mengadopsi panduan **Material Design 3 (M3) / Google Material You** dengan nuansa premium macOS. Semua elemen diatur secara ketat melalui token CSS variabel global di [index.css](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/index.css).

### Variabel Warna Utama (Google Soft Palette)
Aplikasi membagi palet warna menjadi dua tema utama yang berubah secara mulus lewat kelas `.dark`:

| Nama Variabel CSS | Deskripsi Warna | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| `--md-sys-color-primary` | Warna aksen/utama | `#1a73e8` (Google Blue) | `#aecbfa` |
| `--md-sys-color-primary-container` | Latar belakang kontainer aksen | `#e8f0fe` | `#185abc` |
| `--md-sys-color-background` | Latar belakang utama aplikasi | `#f8f9fa` | `#202124` |
| `--md-sys-color-surface` | Latar belakang panel & kartu | `#ffffff` | `#303134` |
| `--md-sys-color-outline` | Border elemen interaktif | `#9aa0a6` | `#9aa0a6` |
| `--md-sys-color-outline-variant` | Border tipis dekoratif | `#e8eaed` | `#3c4043` |
| `--md-sys-color-error` | Warna indikator error/hapus | `#d93025` | `#f28b82` |
| `--md-sys-color-cyan` | Aksen khusus platform TikTok | `#00acc1` | `#80deea` |
| `--md-sys-color-yellow` | Aksen penanda FYP/Folder | `#f9ab00` | `#fde293` |

### Tipografi
*   Font Utama: **Google Sans** dan **Roboto** (diimpor langsung dari Google Fonts).
*   Font Display: **Google Sans Display** untuk judul besar sidebar dan Toolbar.
*   Penerapan ukuran, tinggi baris (*line-height*), dan jarak huruf (*letter-spacing*) menggunakan kelas pembantu standar (`.md-title-large`, `.md-label-medium`, `.md-body-small`, dll).

### Animasi Motion & Easing Curves (M3)
Aplikasi mendefinisikan kurva pelambatan khusus untuk memastikan semua interaksi terasa alami dan responsif:
- `--md-easing-standard`: `cubic-bezier(0.2, 0, 0, 1)`
- `--md-easing-standard-decelerate`: `cubic-bezier(0, 0, 0, 1)`
- `--md-easing-standard-accelerate`: `cubic-bezier(0.3, 0, 1, 1)`

Efek animasi transisi diimplementasikan menggunakan CSS `@keyframes` kustom:
- `md-dialog-enter`: Animasi skala `0.92` ke `1` diiringi peningkatan opacity.
- `md-dialog-exit`: Animasi skala `1` ke `0.95` diiringi pemudaran opacity.
- `md-backdrop-in` / `md-backdrop-out`: Transisi fade-in/out latar belakang hitam transparan modal.
- `md-snackbar-in`: Animasi bergeser ke atas (`translateY`) dari dasar layar.

---

## 9. Riwayat Refactoring & Migrasi (Asrep ke As-Wrapped)

Proyek ini telah melalui proses pembenahan arsitektur basis data yang signifikan guna meningkatkan skalabilitas pencatatan konten. 

### Sebelum Refactoring (Versi Asrep)
*   Setiap data konten yang dimasukkan ke folder bulanan hanya memuat data untuk **satu** platform saja (memiliki properti `platform: 'instagram'` atau `'tiktok'`).
*   Jika pembuat konten mengunggah video yang sama di kedua platform, mereka harus membuat **dua entri terpisah** di dalam folder yang sama, yang menyebabkan duplikasi judul, ketidakurutan tabel, dan mempersulit kalkulasi perbandingan performa.

### Setelah Refactoring (Versi As-Wrapped)
*   Struktur data diubah menjadi berpasangan. Setiap objek `ContentEntry` memuat metrik untuk objek `instagram` dan `tiktok` secara bersamaan.
*   Pembaruan ini diselesaikan secara otomatis melalui skrip [patch_dashboard.cjs](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/patch_dashboard.cjs) yang membaca kode sumber frontend, menyisipkan fungsi helper `getMetrics` untuk kalkulasi dinamis, menghapus pemfilteran platform di dashboard, serta menyelaraskan pemetaan Tooltip dan Top Performing Content.
*   State manager [useAppState.ts](file:///Users/Bonnxxv/Documents/Projek%20App%20Bonnxxv/As-Wrapped/src/hooks/useAppState.ts) diprogram dengan fungsi penanganan migrasi cerdas (`migrateFoldersData`) untuk mengubah data dengan format lama secara dinamis dari Local Storage pengguna ke bentuk bersarang baru tanpa merusak database yang sudah ada.

---

## 10. Panduan Menjalankan & Membangun Proyek

### 1. Pemasangan Dependensi
Buka terminal di direktori root proyek `As-Wrapped`, kemudian jalankan:
```bash
npm install
```

### 2. Menjalankan Aplikasi dalam Mode Pengembangan
Untuk memicu server pengembangan frontend (Vite) dan membuka jendela desktop aplikasi Tauri secara bersamaan:
```bash
npm run tauri dev
```
Fitur *hot-reload* aktif secara default. Setiap perubahan pada file React atau Rust akan memperbarui aplikasi desktop secara instan.

### 3. Pembuatan Bundler Produksi (Native Build)
Untuk membangun aplikasi produksi siap pakai yang teroptimasi penuh sesuai dengan sistem operasi perangkat saat ini:
```bash
npm run tauri build
```
File biner hasil build akan ditempatkan di dalam direktori `src-tauri/target/release/bundle/` (misalnya berupa berkas `.app` untuk macOS atau `.exe` untuk Windows).
