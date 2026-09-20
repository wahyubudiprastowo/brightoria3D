#!/usr/bin/env node
/**
 * fix-lock-order.mjs — Perbaikan urutan deklarasi (Patch 67).
 *
 * Jalankan dari ROOT proyek:
 *     node fix-lock-order.mjs
 *
 * ====================================================================
 * SATU BUG, DUA GEJALA — DAN INI KESALAHAN SAYA
 * ====================================================================
 * Skrip Patch 66 menyisipkan pendengar tombol tembak tepat SEBELUM
 * `const setLane`. Saya MENGIRA `setLane` datang sesudah
 * `handleCross`. Ternyata sebaliknya:
 *
 *     ~1000  const setLane     = useCallback(...)   <- disisipkan di sini
 *     ~1015  const steer       = useCallback(...)
 *      1028  const handleCross = useCallback(...)   <- baru ada di sini
 *
 * GEJALA 1 — build gagal:
 *     TS2448: 'handleCross' used before its declaration
 *
 * GEJALA 2 — permainan mati total, semua efek hilang:
 *     `const` berada di Temporal Dead Zone sampai barisnya dieksekusi.
 *     Badan komponen React berjalan dari atas ke bawah, jadi baris
 *
 *         }, [phase, handleCross]);
 *
 *     membaca `handleCross` SAAT RENDER, sebelum ia ada. Hasilnya
 *     ReferenceError di tengah render, dan seluruh komponen runtuh.
 *
 *     Dev server tidak memeriksa tipe, jadi galat ini baru terlihat
 *     saat permainan dibuka — bukan saat `npm run dev` dijalankan.
 *
 * ====================================================================
 * PERBAIKAN
 * ====================================================================
 * Blok dipindahkan ke SESUDAH `handleCross` selesai dideklarasikan.
 *
 * Batas akhir `handleCross` dicari dengan MENGHITUNG TANDA KURUNG,
 * bukan mencocokkan teks. Penghitungan tidak bergantung pada spasi,
 * indentasi, maupun akhir baris CRLF Windows — pelajaran dari Patch 58
 * dan 62, di mana pencocokan teks yang kaku berulang kali gagal.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Perbaikan Urutan Deklarasi (TS2448)${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// ALAT
// ---------------------------------------------------------------------------

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

/**
 * Mencari akhir sebuah pernyataan `const NAMA = useCallback(...)`.
 *
 * Menghitung tanda kurung dari `(` milik useCallback sampai
 * pasangannya, lalu memasukkan titik koma sesudahnya.
 *
 * Tanda kurung di dalam string dan komentar diabaikan — tanpa itu,
 * sebuah string berisi `(` akan mengacaukan perhitungan.
 */
function findDeclarationEnd(text, name) {
  const sig = `const ${name} = useCallback(`;
  const at = text.indexOf(sig);
  if (at === -1) return -1;

  let i = at + sig.length - 1;   // posisi '('
  let depth = 0;
  let state = 'code';

  while (i < text.length) {
    const c = text[i], nx = text[i + 1];

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
          // Sertakan titik koma bila ada.
          let end = i + 1;
          while (end < text.length && /\s/.test(text[end]) && text[end] !== '\n') end++;
          if (text[end] === ';') end++;
          return end;
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

  return -1;
}

// ---------------------------------------------------------------------------
// BLOK YANG DIPINDAHKAN
// ---------------------------------------------------------------------------

const BLOCK = `
  /**
   * Tombol Tembak mengunci jawaban jalur yang sedang ditempati.
   *
   * Tanpa ini, tombolnya hanya menghasilkan kilatan cahaya — dan anak
   * akan segera berhenti menekannya karena terasa palsu.
   *
   * DILETAKKAN SESUDAH handleCross dengan sengaja. Menaruhnya sebelum
   * itu membuat daftar dependensi membaca handleCross saat render,
   * padahal ia masih di Temporal Dead Zone — komponen langsung runtuh.
   * Itulah galat TS2448 di Patch 66.
   *
   * Hanya berlaku saat fase 'flying' dan setelah waktu baca habis.
   * Menembak selama fase baca akan menghukum anak yang penasaran
   * menekan tombol sebelum sempat membaca soalnya.
   */
  useEffect(() => {
    function onLock() {
      try {
        if (phase !== 'flying') return;
        if (readRef.current > 0) return;
        handleCross();
      } catch {
        /* diamkan */
      }
    }
    window.addEventListener('brightoria:skyrun-lock', onLock);
    return () => window.removeEventListener('brightoria:skyrun-lock', onLock);
  }, [phase, handleCross]);
`;

// ---------------------------------------------------------------------------
// 1. BUANG BLOK YANG SALAH TEMPAT
// ---------------------------------------------------------------------------

let src = readFileSync(path, 'utf8');
const original = src;

const marker = "window.addEventListener('brightoria:skyrun-lock', onLock);";

if (!src.includes(marker)) {
  console.log(`${C.warn}⚠${C.x}  Pendengar tombol tembak tidak ditemukan.`);
  console.log(`${C.dim}   Jalankan flow-fix.mjs dari Patch 66 lebih dulu.${C.x}\n`);
  process.exit(1);
}

/**
 * Menemukan batas blok useEffect yang memuat pendengar itu, termasuk
 * komentar di atasnya.
 */
function removeListenerBlock(text) {
  const at = text.indexOf(marker);
  if (at === -1) return null;

  // Mundur cari `useEffect(` terdekat.
  const head = text.slice(0, at);
  const effectAt = head.lastIndexOf('useEffect(');
  if (effectAt === -1) return null;

  // Mundur lagi melewati komentar blok di atasnya, bila ada.
  let start = effectAt;
  const before = text.slice(0, effectAt);
  const commentEnd = before.lastIndexOf('*/');
  if (commentEnd !== -1 && effectAt - commentEnd < 900) {
    const commentStart = before.lastIndexOf('/**', commentEnd);
    if (commentStart !== -1) {
      // Sertakan indentasi baris komentar.
      const lineStart = before.lastIndexOf('\n', commentStart);
      start = lineStart === -1 ? commentStart : lineStart + 1;
    }
  } else {
    const lineStart = before.lastIndexOf('\n', effectAt);
    start = lineStart === -1 ? effectAt : lineStart + 1;
  }

  // Maju dari `useEffect(` hitung kurung sampai tutup.
  let i = effectAt + 'useEffect'.length;
  let depth = 0;
  let state = 'code';
  let end = -1;

  while (i < text.length) {
    const c = text[i], nx = text[i + 1];

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
          while (e < text.length && /[\s;]/.test(text[e])) e++;
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

  if (end === -1) return null;
  return text.slice(0, start) + text.slice(end);
}

const cleaned = removeListenerBlock(src);
if (cleaned === null) {
  console.log(`${C.err}✗${C.x} Gagal menemukan batas blok pendengar.\n`);
  process.exit(1);
}
src = cleaned;
console.log(`${C.ok}✔${C.x} Blok yang salah tempat dibuang`);

// ---------------------------------------------------------------------------
// 2. SISIPKAN SESUDAH handleCross
// ---------------------------------------------------------------------------

const insertAt = findDeclarationEnd(src, 'handleCross');
if (insertAt === -1) {
  console.log(`${C.err}✗${C.x} Deklarasi handleCross tidak ditemukan.`);
  console.log(`${C.dim}   Berkas TIDAK diubah.${C.x}\n`);
  process.exit(1);
}

src = src.slice(0, insertAt) + '\n' + BLOCK + src.slice(insertAt);
console.log(`${C.ok}✔${C.x} Blok dipindahkan ke sesudah handleCross`);

// ---------------------------------------------------------------------------
// 3. PERIKSA URUTAN — jaring pengaman atas bug ini sendiri
// ---------------------------------------------------------------------------

const declAt = src.indexOf('const handleCross = useCallback(');
const useAt = src.indexOf('}, [phase, handleCross]);');

if (declAt === -1 || useAt === -1 || useAt < declAt) {
  console.log(`${C.err}✗${C.x} Urutan masih salah — berkas TIDAK ditulis.`);
  console.log(`${C.dim}   deklarasi di ${declAt}, pemakaian di ${useAt}${C.x}\n`);
  process.exit(1);
}
console.log(`${C.ok}✔${C.x} Urutan benar: deklarasi sebelum pemakaian`);

// ---------------------------------------------------------------------------
// 4. PERIKSA STRUKTUR SEBELUM MENULIS
// ---------------------------------------------------------------------------

const check = balance(src);
console.log(`\n${C.dim}Pemeriksaan struktur: ${check.report}${C.x}`);

if (!check.ok) {
  console.log(`${C.err}✗${C.x} HASIL TIDAK SEIMBANG — berkas TIDAK ditulis.`);
  console.log(`${C.dim}   Berkas Anda dibiarkan apa adanya.${C.x}\n`);
  process.exit(1);
}
console.log(`${C.ok}✔${C.x} Struktur seimbang`);

if (src === original) {
  console.log(`\n${C.dim}Tidak ada yang berubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

// Cadangan bercap waktu — tidak pernah menimpa maupun dipulihkan
// otomatis. Perbaikan atas rantai .bak basi di Patch 60-63.
const stamp = Date.now();
copyFileSync(path, `${path}.bak-${stamp}`);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}Selesai${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak-${stamp}${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
