# Dokumentasi Desain UI/UX Komprehensif — Asrep Tracker

Dokumentasi ini menetapkan panduan desain, sistem token, aturan aksesibilitas (WCAG), tata letak (*layout*), warna, dan pola interaksi yang diterapkan pada antarmuka pengguna (UI) dan pengalaman pengguna (UX) aplikasi **Asrep Tracker**. 

Dokumen ini merupakan sumber tunggal kebenaran (*single source of truth*) bagi semua keputusan visual dalam pengembangan aplikasi.

---

## 1. Filosofi & Pendekatan UX
Antarmuka Asrep Tracker dirancang dengan pendekatan **Modern Clean, Breathable, and Productive**:
*   **Whitespace-First:** Menolak desain yang padat dan berantakan. Tata letak memprioritaskan ruang kosong (*whitespace*) yang teratur sebagai pembatas visual alami untuk memandu mata pengguna dan mengurangi kelelahan kognitif (*cognitive load*).
*   **Gestalt Proximity:** Elemen-elemen yang memiliki kaitan fungsional diletakkan berdekatan (misal: jarak label input ke input box hanya `8px`), sedangkan seksi/bagian yang berbeda dipisahkan oleh ruang yang lebih lebar (`24px` atau `32px`).
*   **Google Material Design 3 (M3):** Mengadopsi prinsip adaptif Material 3 dengan sudut membulat yang nyaman di mata, warna kontainer tonal yang fungsional, dan transisi elevasi yang anggun.
*   **Minimalis & Efisien:** Mengurangi dekorasi visual yang tidak perlu (seperti garis tepi tebal) dan mengutamakan keterbacaan data numerik secara cepat (*glanceable data scanning*).

---

## 2. Palet Warna Fungsional & Kontras (Light/Dark Mode)

Aplikasi menggunakan palet warna Google Soft yang dikoordinasikan melalui CSS Custom Variables untuk menghasilkan visual adaptif dan kontras yang seimbang pada mode Terang (*Light*) dan Gelap (*Dark*).

### 2.1. Tabel Referensi Hex Warna Sistem

| Nama Token CSS | Mode Terang (Light) | Mode Gelap (Dark) | Peran Fungsional & Konteks UI |
| :--- | :--- | :--- | :--- |
| `--md-sys-color-primary` | `#1a73e8` (Blue) | `#aecbfa` (Blue Soft) | Tombol aksi utama, tab aktif, penanda tanggal kalender aktif. |
| `--md-sys-color-primary-container` | `#e8f0fe` | `#185abc` | Latar belakang kontainer aktif, banner informasi utama. |
| `--md-sys-color-secondary` | `#1e8e3e` (Green) | `#a8dab5` (Green Soft)| Indikator status positif, checkmark, tombol tonal sekunder. |
| `--md-sys-color-secondary-container` | `#e6f4ea` | `#1b5e20` | Latar chip aktif status, menu sidebar aktif. |
| `--md-sys-color-error` | `#d93025` (Red) | `#f28b82` (Red Soft)  | Tombol hapus, status kesalahan, indikator metrik Instagram. |
| `--md-sys-color-error-container` | `#fce8e6` | `#8c1d18` | Latar belakang badge Instagram, chip error. |
| `--md-sys-color-background` | `#f8f9fa` (Off-White)| `#202124` (Charcoal) | Latar belakang dasar aplikasi (*canvas*). |
| `--md-sys-color-surface` | `#ffffff` (White) | `#303134` (Soft Gray) | Latar belakang kartu (*card*), modal dialog, popup detail. |
| `--md-sys-color-surface-variant` | `#f1f3f4` | `#3c4043` | Latar belakang input field, status hover navigasi. |
| `--md-sys-color-on-surface` | `#202124` | `#e8eaed` | Teks utama, nilai metrik besar, judul kartu. |
| `--md-sys-color-on-surface-variant`| `#5f6368` (Muted) | `#9aa0a6` (Muted Gray)| Teks sekunder, label metrik card (Views/Likes), ikon rest. |
| `--md-sys-color-outline-variant` | `#dadce0` | `#5f6368` | Garis tepi tipis pada kartu dan tabel divider. |

### 2.2. Tambahan Warna Khusus Lintas Platform (Google Soft Palette)
*   **TikTok Cyan Accent:**
    *   Terang: Kontainer `#e0f7fa`, Teks `#006064`, Ikon/Garis `#00acc1`.
    *   Gelap: Kontainer `#00485c`, Teks `#e0f7fa`, Ikon/Garis `#80deea`.
*   **FYP Amber/Yellow Accent:**
    *   Terang: Kontainer `#fef7e0`, Teks `#b06000`, Ikon/Garis `#f9ab00`.
    *   Gelap: Kontainer `#5c4000`, Teks `#fef7e0`, Ikon/Garis `#fde293`.

### 2.3. Aturan Penggunaan Warna Wajib
*   **Aturan "Less is Often More" (Selective Primary Color):** Warna utama (*Primary*, `--md-sys-color-primary`) digunakan **HANYA** untuk elemen interaktif seperti Call-to-Action, tombol aksi utama, tab aktif, atau *links*. JANGAN gunakan warna utama yang mencolok sebagai latar belakang (*background*) pada area blok non-interaktif berukuran besar.
*   **Aturan "No Pure Black":** Dilarang keras menggunakan teks hitam pekat (`#000000` atau `text-black`) di atas background terang karena dapat menyebabkan *glare* dan mata cepat lelah. Gunakan warna *dark gray* seperti `text-slate-800` (untuk *Heading*) atau `text-slate-600` (untuk teks paragraf).

---

## 3. Tipografi Skala Presisi (Precise Typography)

Sistem tipografi menggunakan jenis font **Google Sans** sebagai penampil display utama dan **Roboto** untuk teks numerik serta detail paragraf. 

### 3.1. Tabel Skala Tipografi M3

| Kelas Tipografi | Ukuran Font (px) | Weight | Line Height | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| `.md-display-small` | `36px` | 400 | `44px` | Teks judul utama yang sangat besar (dekoratif) |
| `.md-headline-large` | `32px` | 400 | `40px` | Judul halaman utama (Dashboard / Month Folder) |
| `.md-headline-medium` | `28px` | 400 | `36px` | Judul diagram tren besar |
| `.md-headline-small` | `24px` | 400 | `32px` | Judul seksi utama di dashboard |
| `.md-title-large` | `22px` | 400 | `28px` | Nilai metrik utama pada stat-card (Views/Uploads) |
| `.md-title-medium` | `16px` | 500 | `24px` | Judul kartu popup detail, header form |
| `.md-title-small` | `14px` | 500 | `20px` | Label navigasi sidebar aktif, nama profil |
| `.md-label-large` | `14px` | 500 | `20px` | Teks tombol aksi utama, header tabel |
| `.md-label-medium` | `12px` | 500 | `16px` | Label tab ringkasan, badge FYP, chart tick labels |
| `.md-label-small` | `11px` | 500 | `16px` | Teks keterangan penunjang sangat kecil (misal: label sun-sat) |
| `.md-body-large` | `16px` | 400 | `24px` | Teks isi paragraf utama |
| `.md-body-medium` | `14px` | 400 | `20px` | Teks tabel konten, deskripsi form |
| `.md-body-small` | `12px` | 400 | `16px` | Teks microcopy, fine print, keterangan tooltip |

### 3.2. Batas Ukuran Teks Minimum & Aturan Kontras (Aksesibilitas)
*   **Aturan Minimum 12px:** Untuk melindungi mata pengguna dari ketegangan visual, ukuran teks di bawah `12px` dilarang digunakan pada komponen visual mana pun (kecuali label kecil kalender yang diatur maksimal 11px semi-bold). 
*   **Rasio Kontras Keterbacaan:** Semua teks deskripsi menggunakan warna kontras aman dengan rasio minimal **4.5:1** terhadap latar belakang (memenuhi kriteria WCAG AA). Teks tidak boleh menggunakan warna abu-abu yang terlalu tipis di atas putih, maupun hitam murni `#000000` di atas putih murni `#ffffff` karena dapat memicu efek silau (*glare*).

### 3.3. Batas Panjang Baris & Perataan Teks
*   **Aturan Panjang Baris (Line Length):** Jangan pernah membiarkan blok teks paragraf deskripsi membentang memenuhi lebar layar penuh (100% width). Terapkan batas maksimal **45-75 karakter per baris**. Gunakan *utility class* Tailwind seperti `max-w-prose`, `max-w-2xl`, atau `max-w-[70ch]` pada kontainer teks panjang.
*   **Aturan Perataan Teks (Alignment):**
    *   **Rata Kiri (Default):** Seluruh paragraf panjang, deskripsi, *list*, tabel, dan form WAJIB diratakan ke kiri (`text-left`).
    *   **Rata Tengah (Terbatas):** HANYA BOLEH digunakan untuk teks sangat pendek (maksimal 2 baris), seperti Judul Utama (*Hero Title*), Call-to-Action, atau label *Empty State*. Dilarang menggunakan rata tengah untuk blok paragraf panjang.

---

## 4. Sistem Tata Letak, Grid, & Kelipatan Spasi (Layout Scale)

Layout aplikasi diatur sepenuhnya menggunakan **Sistem Spasi Kelipatan 4 atau 8 piksel**. Jarak acak ganjil (seperti `13px`, `19px`, `31px`) dihindari untuk menjaga ritme grid visual tetap seimbang.

### 4.1. Radius Sudut (Shape Radius Scale)
Radius sudut diatur bertingkat sesuai hierarki dimensi komponen:
*   `--radius-xs` (`4px`): Sudut kecil (checkbox checkmark, indikator badge mini).
*   `--radius-sm` (`8px`): Chip penanda filter (`.md-chip`), sel kalender.
*   `--radius-md` (`12px`): Input field (`.gai-input`), dropdown macOS.
*   `--radius-lg` (`16px`): Kartu metrik standar (`.md-card`, `.stat-card`), item feed popup.
*   `--radius-xl` (`20px`): Tombol aksi input dialog modal.
*   `--radius-2xl` (`24px`): Banner snackbar notifikasi utama, kartu ringkasan tahunan.
*   `--radius-3xl` (`28px`): Kartu popup modal utama (`.md-dialog-enter`).
*   `--radius-full` (`9999px`): Tombol pil utama, tab kategori navigasi.

### 4.2. Aturan Spasi Layout
*   **Jarak Antarkartu (Gap):** Grid dashboard utama menggunakan `gap-4` (`16px`) pada desktop dan `gap-3` (`12px`) pada tablet.
*   **Padding Kartu:** Seluruh kartu metrik menggunakan padding konsisten `p-5` (`20px`) untuk melegakan pembacaan angka. Padding item list popup detail diatur seragam pada `p-4` (`16px`).
*   **Proximity Margin:** Label input ke box input menggunakan margin bawah `mb-2` (`8px`). Jarak antar seksi form input menggunakan margin bawah `mb-4` (`16px`).

---

## 5. Sistem Bayangan & Kedalaman (Drop Shadow Scale)

Bayangan digunakan untuk memberikan kedalaman visual (*elevation*) adaptif antara latar belakang dasar (*canvas*) dengan elemen interaktif:

*   **Elevasi 0 (Datar):** Tanpa bayangan. Digunakan pada kartu informasi pasif dan sel tabel. Menggunakan garis tepi super tipis (`border-[color:var(--md-sys-color-outline-variant)]`) untuk pembatas visual.
*   **Elevasi 1 (Soft Shadow):**
    `box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px 1px rgba(0,0,0,.04)`
    Digunakan pada kartu metrik dashboard hover-state (`.stat-card:hover`) dan indikator penanda tab aktif.
*   **Elevasi 2 (Medium Shadow):**
    `box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 2px 6px 2px rgba(0,0,0,.06)`
    Digunakan pada dropdown kustom (`MacDropdown`) dan kartu sub-menu popup.
*   **Elevasi 3 (Strong Shadow):**
    `box-shadow: 0 4px 8px 3px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.06)`
    Digunakan pada modal dialog konfirmasi utama dan banner snackbar notifikasi.

*Catatan: Pada Mode Gelap (.dark), opacity bayangan ditingkatkan (rgba hitam 0.3 dan 0.2) untuk mengompensasi penyerapan cahaya di latar belakang gelap.*

---

## 6. Aksesibilitas Khusus Buta Warna (Colorblind Adaptability)

Mengikuti kriteria WCAG dalam menyajikan status sistem, aplikasi ini menerapkan aturan **"Bentuk + Warna"** secara ketat untuk penandaan kritis:

1.  **Ikon Checkmark pada Status Terbit:**
    Status dipublikasikan (*published status*) di dalam tabel konten bulanan dan popup detail tidak hanya ditandai dengan warna hijau. Status ini wajib dipadukan dengan ikon checkmark (`Check` dari `lucide-react`) berukuran `14px`:
    `[ Ikon Check ] Terbit`
    Hal ini membantu penderita *Achromatopsia* (buta warna total) atau *Deuteranopia* (buta warna hijau-merah) untuk mengenali status sukses secara instan dari simbol bentuknya.
2.  **Ikon Sparkles pada FYP Hits:**
    Konten populer (views > 20K) ditandai dengan ikon bintang berkilau (`Sparkles` berukuran `14px`) di samping tulisan `FYP` untuk membedakannya dari postingan biasa.

---

## 7. Sistem Motion & Animasi (Motion System)

Animasi dirancang menggunakan kurva pelambatan material (*Material Deceleration Curves*) untuk memberikan impresi antarmuka yang cepat dan responsif:

### 7.1. Easing & Durasi
*   `--md-easing-standard`: `cubic-bezier(0.2, 0, 0, 1)` (Transisi warna/hover standar).
*   `--md-easing-standard-decelerate`: `cubic-bezier(0, 0, 0, 1)` (Animasi masuk dialog, terasa responsif saat di-klik).
*   `--md-easing-standard-accelerate`: `cubic-bezier(0.3, 0, 1, 1)` (Animasi keluar dialog).
*   `--md-duration-medium2`: `300ms` (Durasi geser navigasi sidebar).
*   `--md-duration-short3`: `150ms` (Durasi fading hover state).

### 7.2. Animasi Transisi Dialog Modal
*   **Keyframes Enter:** Dialog modal memudar masuk dan membesar dari skala `92%` ke `100%` selama `250ms`:
    `opacity: 0; transform: scale(0.92)` -> `opacity: 1; transform: scale(1)`
*   **Keyframes Exit:** Dialog modal memudar keluar dan menyusut ke skala `95%` selama `200ms`.

---

## 8. Spesifikasi Desain Komponen Utama

### 8.1. MacSidebar (Sidebar Navigasi Kiri)
*   **Animasi Fading Label:** Saat sidebar ditutup (*collapsed*), label teks menu tidak hanya menghilang tiba-tiba. Kami menerapkan transisi terpadu `max-width`, `opacity`, dan `pointer-events` selama `300ms` dengan kelas CSS:
    `transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`
*   **Morphing Bottom Buttons:** Tombol impor/ekspor bertransformasi bentuk secara dinamis untuk mencegah perubahan visual yang mendadak:
    *   *Kondisi Sidebar Lebar:* Menggunakan tombol penuh dengan teks (`w-full h-9 px-4 rounded-xl text-xs gap-2`).
    *   *Kondisi Sidebar Sempit:* Berubah menjadi tombol melingkar ikon-only (`w-10 h-10 rounded-full self-center`). Penataan dalam satu kolom vertikal mencegah tombol melompat arah horizontal.

### 8.2. Dashboard View & Diagram Recharts
*   **Interactive Stat Cards:** Kartu metrik (Views, Uploads, Engagement, FYP Hits) diatur dengan perataan tinggi yang sejajar. Hover-state memicu perubahan warna border ke warna biru primary dan memunculkan bayangan elevasi 1.
*   **Standardisasi Ukuran Font Diagram:** Sumbu diagram tren views (Combined, Daily, dan Weekly Cycle) menampilkan teks angka dan hari berukuran `12px` (mencegah teks terpotong atau terlalu kecil). Tooltip diatur menggunakan padding kelipatan 4 dengan border radius `8px` (`--radius-sm`).
*   **CalendarWidget:** Kalender dirancang minimalis. Tanggal aktif dengan entri konten diberi highlight lingkaran biru solid (`bg-[#0064e0] text-white`) dengan hit-target tap berdiameter `28px` (`w-7 h-7`), diatur sejajar di tengah sel.

### 8.3. Detail Popup (Summary Detail Card Feed)
*   **Card-Feed Layout:** Menggantikan layout tabel padat dengan deretan kartu feed vertikal.
*   **Views Ratio Progress Bar:** Menampilkan diagram proporsi sumbangan views Instagram (merah) vs TikTok (cyan) secara horizontal dalam bar berukuran tinggi `6px` (`h-1.5`) dengan border radius `full` (`rounded-full`).
*   **Scrollbar-Free Native Scrolling:** Scrollbar kaku browser disembunyikan menggunakan utility CSS `scrollbar-width: none` dan `::-webkit-scrollbar { display: none; }` untuk menciptakan visual layaknya aplikasi native, dengan tetap mempertahankan fungsi scroll sentuh/wheel browser yang mulus.

---

## 9. Responsive & Touch Target Guidelines

*   **AAA Touch Target Compliance (Minimum 44px Set):** Seluruh elemen interaktif wajib memenuhi batas sentuhan jari minimal **44px** secara presisi untuk kenyamanan sentuhan jari pada perangkat mobile atau layar sentuh:
    *   *Tombol Utama:* Semua tombol aksi (`.gai-btn-filled`, `.gai-btn-tonal`, `.gai-btn-outlined`, `.gai-btn-text`) memiliki tinggi tetap `44px` di `index.css`.
    *   *Filter Chips:* Chip filter `.md-chip` diatur dengan tinggi `44px` tanpa override tinggi secara inline.
    *   *Dropdown:* Triger `MacDropdown` default diatur dengan tinggi `h-11` (`44px`) dengan teks `text-sm`, dan menu item menggunakan padding vertikal `py-[10px]` untuk area klik optimal.
    *   *Sidebar:* Item navigasi sidebar (`MacSidebar`) diatur dengan ukuran `w-11 h-11` (collapsed) dan `h-11` (expanded). Tombol aksi impor/ekspor di bagian bawah sidebar juga disesuaikan ke tinggi/lebar `44px`.
    *   *Kalender:* Grid kalender bulanan menggunakan sel dengan tinggi `h-11` (`44px`) dan indikator lingkaran seleksi tanggal aktif diperbesar menjadi `w-8 h-8` (`32px`) untuk sentuhan yang lebih presisi.
    *   *Tombol Perbesar Diagram:* Tombol kontrol maximize grafik diganti dengan tombol ikon M3 standar `.md-icon-btn` berdimensi `44px` x `44px`.
    *   *Segmented Toggle:* Tombol beralih Monthly/Annual dibungkus oleh container setinggi `h-11` (`44px`) dengan tombol dalam setinggi `h-9` (`36px`).
*   **Responsive Reflow:** Layout diagram views menggunakan `ResponsiveContainer` dari recharts untuk memastikan diagram menyusut secara proporsional tanpa terpotong di layar tablet maupun ponsel pintar.
