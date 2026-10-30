# Rencana Rilis Web: Hosting di Netlify (Gratis & Cepat)

Kami akan menggunakan **Netlify** sebagai platform hosting karena kemudahan integrasi dengan game web dan dukungan *subdomain* gratis.

---

## 1. Persiapan Teknis untuk Netlify

Berikut adalah rencana langkah demi langkah yang akan saya bantu persiapkan:

### A. Penyiapan File Konfigurasi (`netlify.toml`)
Saya akan membuat file konfigurasi `netlify.toml` di folder utama proyek Anda. File ini memberi tahu Netlify cara membangun dan menyajikan file game Anda.

### B. Otomatisasi Build
Saya akan memverifikasi skrip build Anda di `package.json` agar saat dihubungkan ke Netlify, sistem dapat otomatis melakukan *build* dengan benar (membuat folder `dist` yang berisi file web final).

---

## 2. Langkah-Langkah Anda di Netlify (Manual setup setelah file siap)

Karena saya tidak bisa masuk ke akun pribadi Anda di Netlify, inilah yang perlu Anda lakukan setelah saya menyiapkan file konfigurasinya:

1.  **Daftar/Login**: Buka [app.netlify.com](https://app.netlify.com/) dan login menggunakan akun GitHub/GitLab Anda.
2.  **Hubungkan Proyek**: Klik **"Add new site"** $\rightarrow$ **"Import from existing project"**.
3.  **Pilih Penyedia**: Pilih GitHub atau GitLab tempat Anda menyimpan kode proyek ini.
4.  **Konfigurasi Build**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
5.  **Deploy**: Klik tombol **"Deploy site"**.
6.  **Subdomain**: Netlify akan memberikan alamat acak. Anda bisa mengubahnya ke `bounce-rolling.netlify.app` di bagian **Site Settings** $\rightarrow$ **Change site name**.

---

## 3. Rencana Aksi Saya (Saya akan mengerjakan ini sekarang)

1.  Membuat file `netlify.toml` di direktori utama.
2.  Memastikan skrip `"build": "vite build"` di `package.json` sudah benar.
3.  Menyiapkan panduan "One-Click Deploy" jika Anda lebih suka menghubungkannya melalui Git.

**Apakah Anda setuju dengan rencana ini?** Jika ya, saya akan langsung membuat file konfigurasi tersebut.
