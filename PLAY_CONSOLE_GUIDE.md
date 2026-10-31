# 🚀 Panduan Lengkap Upload Google Play Console: Bounce 3D

Panduan ini berisi petunjuk langkah demi langkah, teks resmi store listing, spesifikasi aset grafis, tautan privacy policy, dan regulasi pengujian tertutup (*Closed Testing*) untuk menerbitkan **Bounce Rolling: 3D Adventure** di Google Play Store.

---

## 📋 DAFTAR PERSIAPAN AWAL

1. **Akun Google Play Console Developer**:
   - Pendaftaran di [play.google.com/console](https://play.google.com/console) (Biaya pendaftaran $25 sekali seumur hidup).
2. **File Bundle Android (.aab)**:
   - Dihasilkan dari Tahap 3 (`bounce3d-release.aab` yang ditandatangani `bounce3d-release-key.keystore`).
3. **Privacy Policy URL Publik**:
   - `https://ais-pre-fbl6tul2notw2npdri73th-983030929293.asia-southeast1.run.app/privacy-policy.html`

---

## 📝 1. TEKS STORE LISTING RESMI (BAHASA INDONESIA & INGGRIS)

### A. Judul Aplikasi (App Title - Maksimal 30 Karakter)
- **ID**: `Bounce Rolling: 3D Adventure`
- **EN**: `Bounce Rolling: 3D Adventure`

### B. Deskripsi Singkat (Short Description - Maksimal 80 Karakter)
- **ID**: `Petualangan bola merah 3D! Jelajahi 33 babak, kumpulkan cincin & kalahkan bos!`
- **EN**: `3D Red ball physics adventure! Master 33 stages, collect rings & defeat bosses!`

### C. Deskripsi Lengkap (Full Description - Maksimal 4000 Karakter)
```text
🔴 KEMBALINYA PETUALANGAN BOLA MERAH 3D AURA ARCADE KLASIK!

Selamat datang di Bounce Rolling: 3D Adventure — game platformer fisika 3D yang menggabungkan keseruan arcade klasik dengan grafik 3D modern! Kendalikan Bola Merah menembus 33 Babak penuh tantangan di 3 Zona Dunia yang memukau.

🔥 FITUR UTAMA GAME:
• 3 Zona Dunia Unik:
  1. Zona 1: Istana Bata Merah Klasik (Stage 1-11)
  2. Zona 2: Rimba Satwa Wild Jungle (Stage 12-22)
  3. Zona 3: Puncak Gletser Es Beku (Stage 23-33)
• Sistem 2 Ukuran Bola (Normal & Big Inflated):
  - Pompa Bola Kecil untuk masuk ke lorong sempit & menyelam di kolam es.
  - Pompa Bola Besar untuk mengapung di atas air & melompat lebih tinggi!
• Mekanika Rintangan & Fisika Realistis:
  - Lantai Karet Biru Bouncy Floor pemicu lompatan tinggi.
  - Perangkap Jembatan Es Rapuh yang retak dan runtuh saat diinjak.
  - Bola Salju Menggelinding dari puncak gunung es.
  - Musuh Beruang Kutub dengan efek Hit-Stun saat dihantam Bintang Kebal!
• Bintang Kebal Pelangi 30 Detik (Star Invincibility):
  - Dapatkan Bintang Kebal dari Kotak Kayu untuk menghancurkan musuh & rintangan!
• Pertarungan Raja Akhir Klimaks (Zone Bosses):
  - Taklukkan Raja Gletser Abadi di Stage 33 dengan 18 Cincin Emas!
• Papan Peringkat Global & Toko Skin:
  - Buka skin bola eksklusif dan bersaing skor tertinggi secara global!

Buktikan ketangkasan jari Anda dan taklukkan seluruh 33 Babak sekarang!
```

---

## 🎨 2. SPESIFIKASI ASET GRAFIS STORE LISTING

| Nama Aset | Ukuran Wajib | Format | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Ikon Aplikasi (App Icon)** | $512 \times 512$px | PNG (Max 1MB) | Bola Merah 3D dengan mahkota emas & latar belakang biru tua. |
| **Banner Promosi (Feature Graphic)** | $1024 \times 500$px | PNG / JPG | Visual panggung 3D Bola Merah melompati cincin emas & gunung es. |
| **Tangkapan Layar HP (Screenshots)** | Min $1080 \times 1920$px | PNG / JPG | Minimal 4 gambar gameplay (Zona 1, Zona 2, Zona 3, & Boss 33). |
| **Tangkapan Layar Tablet** | Min $1920 \times 1080$px | PNG / JPG | Minimal 2 gambar gameplay rasio tablet. |

---

## 🔒 3. PRIVACY POLICY & CONTENT RATING (IARC)

1. **Masuk ke Play Console $\rightarrow$ App Content $\rightarrow$ Privacy Policy**:
   - Masukkan URL: `https://ais-pre-fbl6tul2notw2npdri73th-983030929293.asia-southeast1.run.app/privacy-policy.html`
2. **Kuesioner Content Rating (IARC)**:
   - Pilih Kategori: **Game / Arcade**.
   - Kekerasan: **Tidak ada kekerasan realistis** (Hanya kartun bouncing).
   - Bahasa Kasar: **Tidak ada**.
   - Pembelian In-App: **Tidak ada**.
   - Hasil Rating: **PEGI 3 / Everyone (Semua Umur)**.

---

## 🧪 4. ATURAN CLOSED TESTING (20 TESTERS / 14 HARI)

Sesuai aturan resmi Google Play Store 2024 untuk akun personal baru:
1. Pilih **Testing $\rightarrow$ Closed Testing $\rightarrow$ Create Track**.
2. Unggah file **`bounce3d-release.aab`**.
3. Buat grup Google Group / Email list berisi **minimal 20 alamat email penguji aktif**.
4. Bagikan tautan pengujian (*Opt-in URL*) ke 20 penguji.
5. Biarkan penguji aktif mengunduh dan memainkan aplikasi selama **14 hari berturut-turut**.
6. Setelah 14 hari berlalu, tombol **Apply for Production Release** akan aktif di Play Console untuk rilis publik global!
