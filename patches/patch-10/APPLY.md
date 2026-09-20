# Cara Pasang Patch 10 (Rekonsiliasi Dokumentasi + Juice Kit)

Patch **incremental**. Tidak ada dependency baru — tidak perlu
`npm install` ulang.

## 1. Hentikan dev server
`Ctrl+C` pada terminal yang menjalankan `npm run dev`.

## 2. File yang berubah/baru dalam patch ini

```
src/data/worlds.ts                     (DIPERBAIKI — regresi formasi cincin)
src/game/juice.tsx                     (BARU — juice kit bersama)
src/game/quiz/QuizGame.tsx             (DIPERBARUI — juice terpasang)
src/game/numeria/NumeriaGame.tsx       (DIPERBARUI — juice terpasang)
src/game/digital/DigitalGame.tsx       (DIPERBARUI — juice terpasang)
src/game/arabic/ArabicGame.tsx         (DIPERBARUI — confetti di ringkasan)
src/styles.css                        (DIPERBARUI — CSS juice kit ditambahkan)
AGENTS.md                              (DITULIS ULANG)
CHANGELOG.md                           (DITAMBAHKAN entri Patch 10)
PATCH_NOTES.md                         (DITAMBAHKAN entri Patch 10)
docs/agent-context/PROJECT-MEMORY.md   (DITULIS ULANG)
docs/gameplay/GAMEPLAY-CATALOG.md      (DITULIS ULANG)
docs/product/NEXT-STEPS.md             (DITULIS ULANG)
docs/history/CHANGELOG-FULL.md         (DITAMBAHKAN entri Patch 10)
patches/patch-10/APPLY.md              (file ini)
```

## 3. Copy-paste ke folder proyek — TIMPA file di atas

Salin (timpa) seluruh file di atas ke folder proyek Anda, misalnya:

```
C:\Users\WP2300419\Documents\VContainer\brightoria
```

**Tidak perlu menyentuh file lain** (App.tsx, WorldScene.tsx, game
quran/adab/english/levels.ts, evidence.ts, package.json semua tetap sama).

## 4. Jalankan kembali

```powershell
Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
npm run typecheck
npm run build
npm run dev
```

## 5. Hard refresh browser

```
Ctrl+Shift+R
```

## 6. Uji coba

1. Buka `http://localhost:5173`.
2. **Peta**: klik-tahan dan geser untuk memutar kamera. Perhatikan
   pulau-pulau sekarang saling menyalip depan-belakang saat diputar
   (efek paralaks) — bukan hanya bergeser rata di layar seperti sebelumnya.
   Jarak antar pulau juga lebih rapat.
3. **Setiap dari 6 dunia** — klik pulau, mainkan game:
   - Jawab benar pertama kali → muncul ledakan confetti singkat.
   - Jawab benar 2x berturut-turut → muncul badge "🔥 Nx beruntun".
   - Kartu feedback (benar/salah) terasa "memantul" singkat saat muncul.
   - Selesaikan dunia sampai layar ringkasan → confetti lebih besar
     muncul, ikon/medali di tengah melompat masuk dengan animasi.
4. **Pulau Numeria** khususnya: perhatikan balok jembatan sedikit
   "melompat" (naik + membesar) saat jawaban benar, bukan hanya berubah
   warna instan.
5. Buka DevTools → Application → Local Storage, pastikan key
   `brightoria.evidence.*` dan `brightoria.progress.v2` tetap terupdate
   normal seperti sebelumnya (juice tidak boleh mengubah perilaku ini).

## 7. Jika animasi terasa mengganggu / terlalu ramai

Semua animasi juice menghormati pengaturan sistem "Reduce Motion"
(`prefers-reduced-motion: reduce`) — di Windows: **Settings > Accessibility
> Visual effects > Animation effects** (matikan untuk menguji). Jika masih
terasa berlebihan meski sudah sesuai standar, beri tahu bagian mana yang
ingin dikurangi (mis. hanya confetti di layar ringkasan, badge streak
dihapus, dll.) — ini murni preferensi dan mudah disesuaikan.

## 8. Jika ingin sekalian membersihkan repo (opsional, tidak wajib)

Lihat `AGENTS.md` bagian "Pembersihan repo yang direkomendasikan" untuk
daftar file/folder yang aman dihapus (folder `patches/patches-maps/`, tiga
file `styles-*-addon.css` lama, dan konsolidasi dokumen arsitektur ganda).
Tidak termasuk dalam patch ini karena bersifat opsional/tidak berisiko
menunggu.
