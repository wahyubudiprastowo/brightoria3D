# Cara Pasang Patch 13 — Fix Mascot Bounce, Shadow Blob, Background Baru

## Ringkasan perbaikan dari screenshot Anda

| Masalah yang dilaporkan | Penyebab pasti | Perbaikan |
|---|---|---|
| Maskot "kayak bola bounce" | Animasi lompat vertikal (`reactBounce`) secara harfiah = gerakan bola memantul; sayap/mata terlalu kecil terlihat | Dihapus total gerakan lompat, diganti reaksi "squash & stretch" ala kartun (skala, bukan posisi); ditambah topi nyala, mata besar, halo cahaya |
| Shadow abu-abu mengganggu | Lingkaran warna solid bertepi tegas (hard edge) | Diganti tekstur radial-gradient (dibuat via `<canvas>` HTML, bukan file gambar) — bayangan memudar lembut ke tepi |
| Background kurang menarik | File gambar lama terlalu datar | Diganti background baru bergaya langit fantasi (cahaya keemasan, awan berlapis, partikel kilau) — sudah disertakan di patch ini |

## File yang berubah

```
src/components/BriMascot.tsx           -> TIMPA total
src/components/WorldScene.tsx          -> TIMPA total
src/styles-patch13-fixes.css           -> BARU (tempel ke bawah styles.css)
public/assets/map/sky_dreamy_v2.webp   -> BARU (background langit baru)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa `src/components/BriMascot.tsx` dan `src/components/WorldScene.tsx`.
3. Salin file `public/assets/map/sky_dreamy_v2.webp` ke folder yang sama
   di proyek Anda.
4. Salin seluruh isi `src/styles-patch13-fixes.css`, **tempelkan di baris
   PALING BAWAH** `src/styles.css` Anda (setelah tambahan Patch 12 jika
   ada — tidak masalah jika bertumpuk, karena aturan yang datang
   belakangan otomatis menang).
5. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
6. **Hard refresh**: `Ctrl+Shift+R` (penting — file gambar background baru
   perlu di-load ulang, bukan dari cache lama).

## Uji coba

1. **Background**: peta sekarang menampilkan langit fantasi dengan cahaya
   keemasan dan awan berlapis warna-warni — jauh lebih hidup dari
   sebelumnya.
2. **Shadow**: bayangan di bawah tiap pulau sekarang terlihat lembut
   memudar ke tepi, tidak lagi seperti noda abu-abu bertepi tegas.
3. **Maskot Bri**: perhatikan dekat pulau yang sedang aktif — sekarang
   ada karakter kecil dengan:
   - Badan bulat maroon dengan **topi nyala emas** di atas
   - **Mata besar** yang berkedip menghadap Anda
   - **Halo cahaya keemasan** lembut di belakangnya
   - **Melayang halus naik-turun** (bukan lompat memantul)
   - Klik pulau lain → Bri **berputar cepat + membesar-mengecil sesaat**
     (reaksi "senang" ala kartun), lalu mengekor pindah ke pulau baru
     dengan gerakan halus — TIDAK ADA lagi lompatan vertikal seperti bola.

## Jika maskot masih terasa kurang pas

Beri tahu detail spesifiknya (misalnya "reaksi puter-nya kurang terlihat"
atau "topi emasnya kurang jelas") — bagian ini paling mudah disesuaikan
lebih lanjut karena saya menguasai penuh kode `BriMascot.tsx`.

## Soal upgrade ke model 3D sungguhan (Hunyuan3D-2 / TRELLIS)

Instruksi lengkap cara mengganti maskot primitif ini dengan hasil model
`.glb` dari Hunyuan3D-2/TRELLIS sudah ada sebagai komentar di bagian atas
file `BriMascot.tsx` — cari bagian "CARA UPGRADE KE MODEL 3D SUNGGUHAN".

## Yang masih pending

Untuk menambah karakter/juice ke 5 game lainnya (Adab, English, Quran,
Digital, Arabic), saya masih perlu **isi file game tersebut yang
sebenarnya** (copy-paste ke chat, atau upload ulang zip project terbaru)
supaya perubahan tepat sasaran tanpa risiko merusak yang sudah Anda
bangun.
