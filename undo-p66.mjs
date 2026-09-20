#!/usr/bin/env node
/**
 * undo-p66.mjs — Membuang perubahan berisiko dari Patch 66 (Patch 68).
 *
 * Jalankan dari ROOT proyek:
 *     node undo-p66.mjs
 *
 * ====================================================================
 * HASIL AUDIT: DUA TERSANGKA
 * ====================================================================
 * Membandingkan Patch 65 (jalan) dengan Patch 66 (rusak), hanya dua
 * perubahan yang berisiko tinggi:
 *
 *   1. PENDENGAR LOCK DI SkyRunGame  -> Temporal Dead Zone
 *      Disisipkan SEBELUM `handleCross` dideklarasikan. Saat render,
 *      daftar dependensi membaca `handleCross` yang masih di TDZ ->
 *      ReferenceError -> seluruh komponen runtuh.
 *
 *   2. MutationObserver DI FireButton -> beban DOM berlebihan
 *      Mengamati document.body dengan subtree:true, lalu memanggil
 *      querySelector di TIAP mutasi.
 *
 *      SkyRunGame memanggil setReadUi ~50x selama fase baca 2,6 detik.
 *      Tiap render ulang menyentuh DOM -> observer terpicu ->
 *      pemindaian dokumen penuh. Ditambah R3F yang juga menyentuh DOM
 *      tiap frame, itu bisa ratusan pemindaian per detik.
 *
 *      Bukan loop tak berujung, tapi cukup untuk membekukan perangkat
 *      kelas menengah.
 *
 * Skrip ini membuang keduanya. Permainan kembali ke keadaan Patch 65
 * yang terbukti berjalan.
 *
 * ====================================================================
 * KENAPA MEMBUANG, BUKAN MEMPERBAIKI
 * ====================================================================
 * Tiga patch terakhir semuanya gagal karena saya menambahkan sesuatu
 * ke berkas yang tidak saya lihat isinya. Membuang jauh lebih aman
 * daripada menambah: polanya sudah pasti ada, dan hasilnya bisa
 * diverifikasi.
 *
 * Tombol tembak dikembalikan nanti lewat FireButton versi ringan yang
 * TIDAK memakai MutationObserver sama sekali.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Membuang Perubahan Berisiko Patch 66${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

/** Membuang isi string & komentar agar perhitungan tidak terkecoh. */
function stripLiterals(text) {
  const out = [];
  let i = 0, state = 'code';
  while (i < text.length) {
    const c = text[i], nx = text[i + 1];
    if (state === 'code') {
      if (c === '/' && nx === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && nx === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      out.push(c); i++; continue;
    }
    if (state === 'line') { if (c === '\n') { state = 'code'; out.push(c); } i++; continue; }
    if (state === 'block') { if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; } i++; continue; }
    const q = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === q) state = 'code';
    i++;
  }
  return out.join('');
}

function balance(text) {
  const s = stripLiterals(text);
  const pairs = [['{', '}'], ['(', ')'], ['[', ']']];
  const parts = [];
  let ok = true;
  for (const [o, c] of pairs) {
    const a = s.split(o).length - 1;
    const b = s.split(c).length - 1;
    parts.push(`${o}${c} ${a}/${b}`);
    if (a !== b) ok = false;
  }
  return { ok, report: parts.join('  ') };
}

// ---------------------------------------------------------------------------
// 1. BUANG PENDENGAR LOCK DARI SkyRunGame
// ---------------------------------------------------------------------------

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
const original = src;
const marker = "'brightoria:skyrun-lock'";

if (!src.includes(marker)) {
  console.log(`${C.dim}✓${C.x} Pendengar lock sudah tidak ada`);
} else {
  /**
   * Menemukan batas blok useEffect yang memuat pendengar itu,
   * termasuk komentar di atasnya.
   *
   * Dihitung dengan tanda kurung, bukan pencocokan teks — tidak
   * bergantung pada spasi maupun akhir baris CRLF Windows.
   */
  const at = src.indexOf(marker);
  const head = src.slice(0, at);
  const effectAt = head.lastIndexOf('useEffect(');

  if (effectAt === -1) {
    console.log(`${C.err}✗${C.x} Batas blok tidak ditemukan.\n`);
    process.exit(1);
  }

  // Mundur melewati komentar blok di atasnya.
  let start = effectAt;
  const before = src.slice(0, effectAt);
  const commentEnd = before.lastIndexOf('*/');
  if (commentEnd !== -1 && effectAt - commentEnd < 1200) {
    const commentStart = before.lastIndexOf('/**', commentEnd);
    if (commentStart !== -1) {
      const lineStart = before.lastIndexOf('\n', commentStart);
      start = lineStart === -1 ? commentStart : lineStart + 1;
    }
  } else {
    const lineStart = before.lastIndexOf('\n', effectAt);
    start = lineStart === -1 ? effectAt : lineStart + 1;
  }

  // Maju hitung kurung sampai useEffect tertutup.
  let i = effectAt + 'useEffect'.length;
  let depth = 0;
  let state = 'code';
  let end = -1;

  while (i < src.length) {
    const c = src[i], nx = src[i + 1];
    if (state === 'code') {
      if (c === '/' && nx === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && nx === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      if (c === '(') depth++;
      if (c === ')') {
        depth--;
        if (depth === 0) {
          let e = i + 1;
          while (e < src.length && /[\s;]/.test(src[e])) e++;
          end = e;
          break;
        }
      }
      i++; continue;
    }
    if (state === 'line') { if (c === '\n') state = 'code'; i++; continue; }
    if (state === 'block') { if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; } i++; continue; }
    const q = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === q) state = 'code';
    i++;
  }

  if (end === -1) {
    console.log(`${C.err}✗${C.x} Gagal menentukan akhir blok.\n`);
    process.exit(1);
  }

  src = src.slice(0, start) + src.slice(end);
  console.log(`${C.ok}✔${C.x} Pendengar lock dibuang dari SkyRunGame`);
  console.log(`${C.dim}   penyebab TDZ error & komponen runtuh${C.x}`);
}

// --- Periksa sebelum menulis ---
const check = balance(src);
console.log(`\n${C.dim}Pemeriksaan struktur: ${check.report}${C.x}`);

if (!check.ok) {
  console.log(`${C.err}✗${C.x} HASIL TIDAK SEIMBANG — berkas TIDAK ditulis.\n`);
  process.exit(1);
}
console.log(`${C.ok}✔${C.x} Struktur seimbang`);

// Pastikan tidak ada sisa rujukan handleCross yang menggantung.
const stripped = stripLiterals(src);
const declAt = stripped.indexOf('const handleCross');
const depAt = stripped.indexOf('[phase, handleCross]');
if (depAt !== -1 && (declAt === -1 || depAt < declAt)) {
  console.log(`${C.err}✗${C.x} Masih ada rujukan handleCross sebelum deklarasi.`);
  console.log(`${C.dim}   Berkas TIDAK ditulis.${C.x}\n`);
  process.exit(1);
}

if (src !== original) {
  const stamp = Date.now();
  copyFileSync(path, `${path}.bak-${stamp}`);
  writeFileSync(path, src, 'utf8');
  console.log(`${C.dim}cadangan: ${rel}.bak-${stamp}${C.x}`);
}

// ---------------------------------------------------------------------------
// 2. HAPUS FireButton LAMA
// ---------------------------------------------------------------------------

const fbPath = join(ROOT, 'src/game/skyrun/FireButton.ts');
if (existsSync(fbPath)) {
  const stamp = Date.now();
  copyFileSync(fbPath, `${fbPath}.bak-${stamp}`);
  rmSync(fbPath);
  console.log(`\n${C.ok}✔${C.x} FireButton lama dihapus`);
  console.log(`${C.dim}   MutationObserver-nya memindai dokumen ratusan kali/detik${C.x}`);
} else {
  console.log(`\n${C.dim}✓${C.x} FireButton lama sudah tidak ada`);
}

// ---------------------------------------------------------------------------
// 3. BUANG IMPORNYA DARI main.tsx
// ---------------------------------------------------------------------------

const mainPath = join(ROOT, 'src/main.tsx');
if (existsSync(mainPath)) {
  let main = readFileSync(mainPath, 'utf8');
  const before = main;

  main = main.replace(/^\s*import\s+['"]\.\/game\/skyrun\/FireButton['"];?\s*$/gm, '');

  if (main !== before) {
    writeFileSync(mainPath, main, 'utf8');
    console.log(`${C.ok}✔${C.x} Impor FireButton dibuang dari main.tsx`);
  } else {
    console.log(`${C.dim}✓${C.x} main.tsx tidak memuat impor FireButton`);
  }
}

console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
console.log(`${C.dim}Permainan kembali ke keadaan Patch 65 yang terbukti berjalan.`);
console.log(`Tombol tembak akan dikembalikan lewat versi ringan tanpa observer.${C.x}\n`);
process.exit(0);
