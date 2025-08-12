# Flappy Roket (Web Game)

Game web ringan bergaya *Flappy Bird* — cukup klik/ketuk/tekan spasi untuk menerbangkan roket melewati celah pipa. Dibuat dengan **HTML5 Canvas + CSS + JavaScript vanilla**.

## Cara main
- **Terbang:** klik/ketuk layar atau tekan **Spasi / W / ▲**  
- **Jeda/Lanjut:** **P** atau tombol *Jeda*  
- **Ulang:** **R** atau *Ulang*  
- **Suara:** **M** atau tombol *Suara*  
- Skor dan **rekor tertinggi** tersimpan otomatis di *localStorage*.

## Struktur proyek
```
.
├── index.html     # Halaman utama
├── style.css      # Gaya UI
├── script.js      # Logika game
└── README.md
```

## Jalankan lokal
Cukup buka `index.html` di browser modern (Chrome/Edge/Firefox/Safari).
> Untuk hasil terbaik di perangkat mobile, tambahkan ke Home Screen atau jalankan lewat GitHub Pages.

## Upload ke GitHub & aktifkan GitHub Pages
1. **Buat repo baru** (public) di GitHub, misal: `flappy-roket`.
2. Upload ke repo:
   ```bash
   git init
   git remote add origin https://github.com/<username>/flappy-roket.git
   git add .
   git commit -m "feat: initial Flappy Roket"
   git branch -M main
   git push -u origin main
   ```
3. **Aktifkan GitHub Pages**  
   - Buka **Settings → Pages**  
   - **Source:** pilih `Deploy from a branch`  
   - **Branch:** `main` dan folder `/root` (atau `/`), lalu **Save**  
   - Tunggu beberapa detik; situs Anda akan tersedia di URL seperti:  
     `https://<username>.github.io/flappy-roket/`

> Alternatif: gunakan **CLI `gh-pages`** atau **GitHub Actions** jika ingin otomatisasi build (tidak perlu untuk proyek ini).

## Kustomisasi
- Ubah warna di `style.css` (variabel `--accent`, dll)
- Atur tingkat kesulitan di `script.js` (konstanta `GAP_MIN`, `GAP_MAX`, `SPEED`)
- Ganti bentuk roket/pipa dengan menggambar elemen kanvas berbeda.

## Lisensi
Dirilis di bawah lisensi **MIT**. Silakan gunakan, modifikasi, dan bagikan.
