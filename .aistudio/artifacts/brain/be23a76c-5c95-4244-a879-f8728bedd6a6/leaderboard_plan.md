# Rencana Implementasi: Leaderboard Global & Harian (Miniclip Standard)

Kita akan mengimplementasikan sistem *Leaderboard* profesional ala game Miniclip menggunakan Google Firebase (Google Sign-In + Firestore).

## 1. Arsitektur Teknis
- **Autentikasi**: Google Sign-In (via Firebase Auth) untuk identitas pengguna yang aman & standar.
- **Penyimpanan Data**: Google Firestore untuk sinkronisasi skor secara *real-time*.
- **Jenis Leaderboard**:
  - **Global High Scores**: Skor tertinggi sepanjang masa.
  - **Daily Rankings**: Skor terbaik khusus untuk hari ini (menggunakan filter tanggal).

## 2. Langkah-Langkah Implementasi

### A. Konfigurasi Backend (Firebase)
1.  **Aktifkan Auth**: Mengaktifkan "Google" sebagai penyedia login di Firebase Console.
2.  **Schema Firestore**:
    *   `users`: `{ uid, displayName, email, photoURL }`
    *   `scores`: `{ uid, score, timestamp, dateString (YYYY-MM-DD) }`

### B. Implementasi Frontend (React)
1.  **AuthModal**: Komponen "Login dengan Google" yang muncul sebelum pemain masuk ke papan peringkat.
2.  **LeaderboardModal**: Panel UI yang menampilkan tab "Global" dan "Daily", lengkap dengan avatar pemain, nama, dan skor.
3.  **Score Submission**: Integrasi pengiriman skor otomatis ke Firestore setiap kali pemain menyelesaikan level atau mendapatkan skor baru yang lebih tinggi.

---

## 3. Rencana Aksi

1.  **Setup Firebase Auth & Firestore**: Mengonfigurasi akses Firebase untuk Auth dan Database.
2.  **Pembuatan Komponen**: Membuat `LeaderboardModal.tsx` dan memperbarui `src/services/leaderboardService.ts`.
3.  **Integrasi UI**: Memastikan tombol "Leaderboard" tampil di menu utama dan di akhir level (sesuai standar game arcade).
4.  **Verifikasi**: Tes login Google dan pengiriman skor secara langsung.

---

## 4. Rencana Verifikasi
- **Uji Login**: Memastikan login Google berfungsi dan data profil tersimpan.
- **Uji Leaderboard**: Memastikan skor muncul di daftar Global dan Daily secara instan (real-time).
- **Uji Performa**: Memastikan *query* database tidak membuat game terasa lambat.

Apakah rencana ini sudah sesuai dengan yang kamu harapkan? Jika sudah, klik **Proceed** untuk mulai mengerjakannya!
