# Patch 07 — APPLY Guide: Empat Dunia Demo Kini Playable

## Ringkasan

Patch 07 mengubah empat dunia yang tadinya menampilkan modal "Segera hadir"
menjadi mini-game sungguhan (total enam dunia playable), memakai mesin kuis
bersama DOM/CSS. **Tidak ada dependency baru — tidak perlu `npm install`.**

## Langkah verifikasi (jalankan `npm run dev`, buka http://localhost:5173)

### 1. Cek build
```powershell
npm run typecheck   # harus exit 0
npm run build       # harus sukses; hanya warning ukuran chunk yang lama
```

### 2. Peta (regresi Patch 06)
1. Peta tetap scene Three.js 3D — drag untuk memutar, scroll/pinch zoom.
2. Gap antar-pulau tetap rapat; ketuk pulau → misi card + suara klik.

### 3. Empat dunia baru
3. **Taman Al-Qur'an** → "Mainkan sekarang" → *Lentera Hijaiyah*:
   - Soal 1 tampilkan huruf <strong dir="rtl">ا</strong> (Alif) dengan benar.
   - Lanjut sampai soal harakat: <strong dir="rtl">بَ بِ بُ</strong> — pastikan
     tanda harakat terlihat (fathah/kasrah/dammah).
   - Jawab benar → feedback hijau + penjelasan; salah → merah + "Coba lagi".
4. **Kampung Adab** → *Misi Adab Sehari-hari*: 6 situasi harian terbuka;
   setiap jawaban menampilkan penjelasan adab.
5. **Oasis Bahasa Arab** → *Tebak Kata Arab*: kata Arab tampil besar
   (<strong dir="rtl">بَاب</strong>, <strong dir="rtl">كِتَاب</strong>, dst).
6. **English Harbor** → *Word Docks*: apple, water, sun, house, book, star.

### 4. Reward & XP (kejujuran gameplay)
7. XP +30 hanya bertambah saat jawaban benar PERTAMA kali per soal; jumlah
   XP di header ikut naik; tidak ada imbalan palsu di modal mana pun.
8. Tombol "Petunjuk" dan "Ulangi" berfungsi; jawaban salah tidak menambah
   `completed`.
9. Setelah selesai → halaman summary mastery; "Kembali ke peta" menutup game.
10. Buka kembali pulau yang sama → mastery di mission card telah diperbarui.

### 5. Regresi game lama
11. Pulau Numeria (Fraction Bridge, 3D) dan Benteng Digital masih bisa
    dimainkan seperti sebelumnya.

## Rollback (jika perlu)

Tidak perlu — perubahan hanya menambah file baru di `src/game/` (quiz, quran,
adab, arabic, english) serta mengubah `src/App.tsx` (routing) dan
`src/styles.css` (append section `.quiz-*`). Jika terjadi error, cek
console browser / screenshot `AppErrorBoundary` lalu kirim ke agent.

## Catatan untuk agent berikutnya

- Mesin kuis bersama: `src/game/quiz/QuizGame.tsx` + `src/game/quiz/evidence.ts`.
- Setiap dunia baru TETAP wajib punya `levels.ts`/`evidence.ts`/`XxxGame.tsx`.
- Kebijakan tetap: `styles.css` selalu file lengkap; `AppErrorBoundary` jangan
  dihapus; XP hanya dari hasil belajar nyata; peta 3D tanpa `<Environment>`
  drei dan selalu punya fallback DOM.