# Pembuat Invoice

Website statis untuk membuat invoice langsung di browser, lalu mencetak atau menyimpannya sebagai PDF. Tanpa backend, tanpa build step.

## Fitur

- Isian pengirim, klien, nomor, tanggal, dan jatuh tempo
- Item dinamis (tambah dan hapus), diskon, dan pajak/PPN
- Logo usaha (unggah gambar), warna aksen, mata uang IDR/USD/EUR/SGD
- Terbilang otomatis dalam bahasa Indonesia untuk IDR
- Pratinjau langsung, ukuran cetak A4
- Data tersimpan otomatis di browser (localStorage)

## Struktur

```
index.html   halaman dan formulir
style.css    tampilan layar dan cetak
app.js       logika invoice
```

## Jalankan lokal

Buka `index.html` di browser, atau:

```bash
npx serve .
```

## Deploy: GitHub + Vercel

1. Buat repositori di GitHub, lalu unggah ketiga file di atas ke root repositori.
2. Di Vercel, pilih **Add New > Project** dan impor repositori tersebut.
3. Pengaturan:
   - Framework Preset: **Other**
   - Build Command: kosongkan
   - Output Directory: kosongkan
4. Klik **Deploy**. Setiap `git push` berikutnya otomatis ter-deploy.

## Cetak ke PDF

Klik **Cetak / Simpan PDF**. Di dialog cetak, pilih printer "Simpan sebagai PDF" dan matikan opsi **Header dan footer** supaya hasilnya bersih. Nama file PDF mengikuti nomor invoice.
