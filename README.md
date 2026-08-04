# Opening Checklist Alam Sutera

Web app checklist opening store dengan frontend statis untuk GitHub Pages dan backend Google Apps Script.

## Fitur utama

- Tampilan responsif untuk HP, tablet, dan desktop.
- Checklist bilingual Indonesia–Inggris.
- Pilihan Yes/No yang cepat disentuh.
- Keterangan wajib otomatis saat jawaban No.
- Progres pengisian real-time.
- Nama dan tanda tangan digital PIC Opening, Facility, Security, dan Admin Manager.
- Autosave draft di perangkat.
- Antrean offline. Data yang gagal terkirim disimpan di perangkat lalu dicoba kembali saat online.
- Export PDF langsung dari browser.
- Penyimpanan data ke Google Sheets.
- Penyimpanan tanda tangan ke Google Drive.
- Halaman admin untuk melihat riwayat dan export CSV.
- PWA dasar agar dapat ditambahkan ke layar utama HP.

## Perubahan checklist

- Poin “C. Membuka Storage HBC” dihapus.
- Poin lama nomor 7 diganti menjadi: “Mengisi link opening dan meletakkan kembali kunci master ke keybox.”
- Nomor checklist dirapikan menjadi urut 1 sampai 9. Poin lama nomor 7 menjadi nomor 6 setelah penomoran dirapikan.
- Redaksi Indonesia dan Inggris dirapikan agar lebih konsisten.

## Struktur folder

```text
opening-checklist-app/
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── app.js
│   ├── admin.js
│   ├── config.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   └── assets/icon.svg
└── apps-script/
    ├── Code.gs
    └── appsscript.json
```

## A. Menyiapkan Google Sheets dan Apps Script

1. Buat Google Spreadsheet baru, misalnya bernama `Opening Checklist Alam Sutera`.
2. Salin ID Spreadsheet dari URL. ID adalah teks di antara `/d/` dan `/edit`.
3. Buka `Extensions` → `Apps Script` dari Google Spreadsheet tersebut.
4. Hapus kode bawaan, lalu salin seluruh isi `apps-script/Code.gs` ke file `Code.gs`.
5. Aktifkan tampilan file manifest melalui `Project Settings` jika diperlukan, lalu salin isi `apps-script/appsscript.json` ke file manifest.
6. Buka `Project Settings` → `Script Properties`, lalu tambahkan:

```text
SPREADSHEET_ID = ID_SPREADSHEET_ANDA
ADMIN_PIN = PIN_ADMIN_ANDA
```

`SIGNATURE_FOLDER_ID` bersifat opsional. Jika tidak diisi, backend akan membuat folder Google Drive bernama `Opening Checklist Signatures` secara otomatis.

7. Pilih fungsi `setup`, klik `Run`, lalu setujui izin Google Sheets dan Google Drive.
8. Cek log eksekusi. URL Spreadsheet dan folder tanda tangan akan tampil di log.
9. Klik `Deploy` → `New deployment` → pilih jenis `Web app`.
10. Atur:

```text
Execute as: Me
Who has access: Anyone
```

Jika kebijakan Google Workspace tidak mengizinkan akses anonim, gunakan opsi pengguna yang login dan pastikan seluruh petugas memakai akun yang diizinkan.

11. Klik `Deploy`, lalu salin URL yang berakhiran `/exec`.

## B. Menghubungkan frontend ke Apps Script

Buka `frontend/config.js`, lalu ganti:

```javascript
apiUrl: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
```

menjadi URL deployment Apps Script, contoh:

```javascript
apiUrl: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
```

Nama store dan versi aplikasi juga dapat diubah dari file yang sama.

## C. Deploy frontend ke GitHub Pages

Cara termudah:

1. Buat repository GitHub baru.
2. Upload seluruh isi folder `frontend` ke root repository. Jangan upload folder `frontend` sebagai satu folder jika ingin URL langsung membuka aplikasi.
3. Pastikan `config.js` sudah berisi URL Apps Script.
4. Buka `Settings` → `Pages`.
5. Pada `Build and deployment`, pilih `Deploy from a branch`.
6. Pilih branch `main` dan folder `/(root)`.
7. Simpan. Tunggu GitHub menerbitkan URL Pages.

Contoh struktur repository GitHub:

```text
repo-root/
├── index.html
├── admin.html
├── app.js
├── admin.js
├── config.js
├── styles.css
├── sw.js
├── manifest.webmanifest
└── assets/icon.svg
```

## D. Cara penggunaan

1. Buka URL GitHub Pages.
2. Isi tanggal, waktu, dan nama PIC Opening.
3. Jawab seluruh checklist.
4. Jika memilih `No`, kolom keterangan wajib diisi.
5. Isi nama dan tanda tangan empat pihak.
6. Centang pernyataan.
7. Klik `Kirim checklist`.
8. Data masuk ke Google Sheets dan tanda tangan tersimpan di Google Drive.
9. PDF akan dibuat setelah pengiriman berhasil. Tombol `Export PDF` juga dapat digunakan sebelum pengiriman.

## E. Halaman admin

Buka:

```text
https://URL-GITHUB-PAGES-ANDA/admin.html
```

Masukkan nilai `ADMIN_PIN` yang sudah disimpan di Script Properties. Halaman admin menampilkan maksimal 200 data terbaru dan menyediakan pencarian, filter status, serta export CSV.

## F. Update aplikasi

### Update frontend

Edit file di repository GitHub lalu commit. GitHub Pages akan menerbitkan versi baru secara otomatis. Jika perubahan belum terlihat, refresh paksa atau hapus cache situs karena aplikasi memakai service worker.

### Update backend

1. Edit kode di Apps Script.
2. Klik `Deploy` → `Manage deployments`.
3. Pilih deployment aktif, klik ikon edit.
4. Pilih `New version`, lalu `Deploy`.
5. URL `/exec` biasanya tetap sama selama deployment yang sama diperbarui.

## G. Pengujian sebelum dipakai

- Uji satu pengiriman dengan semua jawaban Yes.
- Uji jawaban No tanpa keterangan. Form harus menolak pengiriman.
- Matikan internet, isi form, lalu kirim. Data harus masuk antrean lokal.
- Nyalakan internet kembali. Aplikasi akan mencoba mengirim antrean otomatis.
- Pastikan baris baru muncul di Google Sheets.
- Pastikan empat file tanda tangan muncul di Google Drive.
- Uji halaman admin dan export CSV.
- Uji Export PDF dari Android dan desktop.

## Catatan keamanan

- Halaman pengisian bersifat publik jika deployment Apps Script menggunakan akses `Anyone`.
- PIN admin hanya melindungi endpoint daftar riwayat, bukan endpoint pengiriman form.
- Jangan memakai PIN yang sama dengan password akun Google.
- Untuk penggunaan dengan data sensitif atau akses lintas banyak toko, tambahkan autentikasi organisasi atau pindahkan backend ke layanan dengan autentikasi penuh.
