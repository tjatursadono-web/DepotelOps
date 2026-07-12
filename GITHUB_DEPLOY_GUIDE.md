# Panduan Deploy ke GitHub Pages (Mengatasi Halaman Blank Putih & Firebase Auth)

Panduan ini menjelaskan penyebab halaman blank putih saat deploy ke GitHub Pages dan cara mengatasinya dengan menggunakan project Firebase Anda sendiri.

---

## 1. Penyebab Masalah (Mengapa Blank Putih?)
1. **Domain Belum Diotorisasi (Authorized Domains):** 
   Aplikasi ini menggunakan Firebase Authentication (Google Sign-In) untuk masuk dan mengelola data. Project Firebase bawaan dari AI Studio (`absolute-portfolio-q2t1j`) dikelola secara otomatis, sehingga Anda tidak memiliki hak akses (Owner) untuk menambahkan domain kustom Anda (seperti `tjatur-sadono.github.io`) ke daftar **Authorized Domains** di Firebase Console. Akibatnya, Firebase menolak inisialisasi/koneksi saat dijalankan di GitHub Pages, sehingga layar menjadi blank putih.
   
2. **Path Aset Statis (Relative Paths):**
   Secara default, Vite memaketkan aplikasi dengan absolute path `/`. Ketika di-deploy ke GitHub Pages (yang biasanya memiliki subfolder, contoh: `username.github.io/nama-repo/`), browser gagal memuat file JavaScript dan CSS. 
   *(Catatan: Kami telah memperbaiki ini di `vite.config.ts` dengan menyetel `base: './'` agar semua file dimuat menggunakan relative path).*

---

## 2. Solusi: Gunakan Project Firebase Anda Sendiri

Untuk menjalankan aplikasi ini dengan sukses di GitHub Pages, Anda perlu menghubungkannya ke project Firebase Anda sendiri di mana Anda memiliki akses penuh sebagai Owner.

### Langkah A: Buat Project Firebase Baru
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik **Add Project** dan ikuti langkah pembuatan project baru.
3. Setelah project dibuat, klik ikon **Web (`</>`)** di dashboard untuk menambahkan aplikasi web baru.
4. Salin kode konfigurasi JSON yang diberikan. Konfigurasinya terlihat seperti ini:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "project-id.firebaseapp.com",
     "projectId": "project-id",
     "storageBucket": "project-id.appspot.com",
     "messagingSenderId": "1234567890",
     "appId": "1:123456:web:abcd"
   }
   ```

### Langkah B: Perbarui File Konfigurasi di Repositori Anda
Ada 2 cara mudah untuk memasukkan kredensial Firebase Anda ke dalam aplikasi:

#### Cara 1: Mengganti File `firebase-applet-config.json` (Paling Direkomendasikan)
Ganti isi file `firebase-applet-config.json` di root direktori project Anda dengan konfigurasi JSON baru Anda di atas. Ketika Anda push ke GitHub, project Anda akan langsung menggunakan Firebase Anda.

#### Cara 2: Menggunakan Environment Variables (GitHub Secrets)
Jika Anda menggunakan GitHub Actions untuk mem-build aplikasi, Anda dapat mengatur Environment Variables berikut di repository GitHub Anda (Settings > Secrets and variables > Actions):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## 3. Langkah C: Aktifkan Google Sign-In & Daftarkan Domain di Firebase Anda
Karena Anda sekarang adalah Owner dari project Firebase tersebut, Anda dapat mengelola pengaturan Authentication dengan bebas:

1. Di Firebase Console Anda, buka menu **Build > Authentication**.
2. Klik tab **Sign-in method** dan aktifkan **Google** provider.
3. Buka tab **Settings** di menu Authentication.
4. Klik opsi **Authorized domains** di panel sebelah kiri.
5. Sekarang, tombol **Add Domain** akan aktif dan bisa diklik!
6. Tambahkan domain GitHub Pages Anda, misalnya:
   * `tjatur-sadono.github.io`
7. Simpan perubahan.

---

## 4. Cara Deploy Cepat ke GitHub Pages via Terminal
Jika Anda ingin men-deploy project ini secara otomatis menggunakan package `gh-pages`:

1. Install `gh-pages` sebagai dev dependency:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Tambahkan script berikut di dalam `"scripts"` pada `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Jalankan perintah deploy:
   ```bash
   npm run deploy
   ```

Aplikasi Anda kini akan ter-deploy dengan sempurna di GitHub Pages dan Firebase Authentication akan berfungsi 100%!
