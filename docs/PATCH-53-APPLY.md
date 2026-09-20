# Patch 53 — Perbaikan laman membeku ("muter-muter, gak kebuka")

**Sifat patch:** perbaikan kritis. Satu berkas, tanpa dependency baru.

---

## Temuan audit: MutationObserver yang menyuapi dirinya sendiri

Di `DailyPractice.tsx` ada observer yang mengamati `document.body`:

```ts
const observer = new MutationObserver(() => {
  ...
  if (!blocked) refreshLabel();        // <- menulis fab.innerHTML
});
observer.observe(document.body, { childList: true, subtree: true });
```

Dan `refreshLabel()` menulis `fab.innerHTML`.

### Rantai kejadiannya

```
observer mengamati document.body (childList, subtree)
        ↓
refreshLabel() menulis fab.innerHTML
        ↓
fab adalah anak body → itu MUTASI childList di dalam subtree
        ↓
observer terpicu lagi
        ↓
refreshLabel() lagi → innerHTML lagi → mutasi lagi → ...
```

Callback MutationObserver berjalan sebagai **microtask**. Microtask harus
habis sebelum browser boleh menggambar. Karena loop ini tidak pernah
habis, browser **tidak pernah sampai ke tahap menggambar** — laman membeku
dengan spinner berputar selamanya.

---

## Kenapa baru muncul sekarang

Sebelum Patch 52, `main.tsx` tidak mengimpor `DailyPractice`, jadi
`mountDailyPractice()` tidak pernah dijalankan dan observer itu tidak
pernah lahir.

Begitu satu baris impor ditambahkan, loop yang sudah tertidur sejak
Patch 35 ikut hidup.

Jadi Patch 52 **membuka** bug lama, bukan menciptakannya — tapi bagi Anda
hasilnya sama saja: aplikasi tidak bisa dipakai.

---

## Bukti bahwa hanya berkas ini yang bermasalah

Empat modul tombol mengambang lain diperiksa dengan pola yang sama:

| Modul | Observer menulis apa | Aman? |
|---|---|---|
| ParentInsight | `fab.hidden` saja | ✅ |
| ExpeditionLauncher | `fab.hidden` saja | ✅ |
| AiCompanion | `fab.hidden` saja | ✅ |
| brandHeader | tidak ada `innerHTML` | ✅ |
| **DailyPractice** | **`fab.innerHTML`** | ❌ |

Kuncinya: `hidden` adalah perubahan **atribut**, sedangkan observer
mengamati **childList**. Menyetel `hidden` tidak pernah memicu observer
kembali. Hanya DailyPractice yang menulis ulang isi tombol.

---

## Perbaikannya: dua lapis

### 1. Observer berhenti memanggil refreshLabel

Sekarang ia hanya menyetel `hidden` — persis pola tiga modul lain yang
selama ini aman.

```ts
const observer = new MutationObserver(() => {
  if (container) return;
  fab.hidden = document.querySelector(GAME_OVERLAY_SELECTORS) !== null;
});
```

### 2. refreshLabel hanya menulis DOM bila isinya benar-benar berubah

```ts
let lastMarkup = '';

function refreshLabel() {
  let markup: string;
  ...
  if (markup === lastMarkup) return;   // tidak berubah -> jangan sentuh DOM
  lastMarkup = markup;
  fab.innerHTML = markup;
}
```

Lapis kedua ini disengaja sebagai **sabuk pengaman**. Kalau suatu saat ada
yang memanggil `refreshLabel` dari dalam observer lagi, loop tetap tidak
bisa terjadi karena penulisan berulang dengan isi sama akan dihentikan.

---

## File dalam patch ini

```
src/game/DailyPractice.tsx   (TIMPA)
```

`main.tsx` dari Patch 52 **tidak perlu diubah lagi** — impornya sudah benar.

---

## Cara memasang

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

---

## Checklist uji

- [ ] Aplikasi **terbuka normal**, tidak membeku
- [ ] Peta dunia bisa diputar seperti biasa
- [ ] Tombol **🔁 Latihan** muncul di rel kiri
- [ ] Ketuk → muncul tiga mode (Latihan Tenang, Lompat Katak, Penerbangan Ilmu)
- [ ] **Lompat Katak** terbuka dan katak melompat
- [ ] **Penerbangan Ilmu** terbuka dan pesawat terbang
- [ ] Tutup permainan → tombol Latihan muncul lagi
- [ ] Buka-tutup beberapa kali, laman tetap ringan
- [ ] Buka game dunia mana pun (mis. Numeria) → tombol Latihan tersembunyi

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung (pemeriksa sadar-string) | ✅ 145/145, 163/163, 14/14 |
| `refreshLabel` di dalam observer | ✅ 0 |
| Penulis `fab.innerHTML` | ✅ 1, terjaga `lastMarkup` |
| Observer hanya menulis `hidden` | ✅ Ya |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan audit tambahan

Satu-satunya spinner di seluruh proyek ada di `WorldPortalHost.tsx`
(teks *"Membuka {worldName}..."*), milik mode Ekspedisi. Karena gejala
Anda muncul di luar konteks itu, yang Anda lihat hampir pasti spinner
**tab peramban** — tanda laman benar-benar membeku, bukan spinner
aplikasi. Itu cocok dengan diagnosis loop microtask di atas.
