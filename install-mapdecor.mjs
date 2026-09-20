#!/usr/bin/env node
/**
 * install-mapdecor.mjs — Memasang hiasan peta (Patch 68).
 *
 * Jalankan dari ROOT proyek:
 *     node install-mapdecor.mjs
 *
 * ====================================================================
 * PERUBAHANNYA SANGAT KECIL — SENGAJA
 * ====================================================================
 * Hanya DUA baris yang disisipkan ke WorldScene.tsx:
 *
 *     import MapDecor from './world3d/MapDecor';
 *     <MapDecor />
 *
 * Tidak ada yang dihapus, tidak ada yang diganti. Bandingkan dengan
 * skrip Patch 61 dan 66 yang MENGGANTI blok fungsi — keduanya rusak
 * karena saya salah menebak batas fungsinya.
 *
 * Menyisipkan jauh lebih aman daripada mengganti: tidak perlu tahu
 * di mana sesuatu berakhir.
 *
 * ====================================================================
 * MEMERIKSA SEBELUM MENULIS
 * ====================================================================
 * Pelajaran Patch 61 (kerusakan struktur) dan Patch 67 (urutan salah):
 * skrip memeriksa keseimbangan kurung SEBELUM menyimpan. Bila tidak
 * seimbang, berkas tidak disentuh sama sekali.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Pemasangan Hiasan Peta${C.x}`);
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
  const pairs = [['{', '}'], ['(', ')'], ['[', ']'], ['<', '>']];
  const parts = [];
  let ok = true;
  // Tanda kurung sudut sengaja TIDAK diperiksa — JSX dan generic
  // membuatnya tidak pernah seimbang secara naif.
  for (const [o, c] of pairs.slice(0, 3)) {
    const a = s.split(o).length - 1;
    const b = s.split(c).length - 1;
    parts.push(`${o}${c} ${a}/${b}`);
    if (a !== b) ok = false;
  }
  return { ok, report: parts.join('  ') };
}

const rel = 'src/components/WorldScene.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

// Pastikan komponennya sudah disalin.
const decorPath = join(ROOT, 'src/components/world3d/MapDecor.tsx');
if (!existsSync(decorPath)) {
  console.log(`${C.err}✗${C.x} MapDecor.tsx belum disalin.`);
  console.log(`${C.dim}   Salin dulu folder src/ dari paket ini.${C.x}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
const original = src;
let changes = 0;

// ---------------------------------------------------------------------------
// 1. IMPOR
// ---------------------------------------------------------------------------
if (src.includes("from './world3d/MapDecor'")) {
  console.log(`${C.dim}✓${C.x} Impor MapDecor sudah ada`);
} else {
  const m = [...src.matchAll(/^import [^;]+;/gm)];
  const line = "import MapDecor from './world3d/MapDecor';";

  if (m.length === 0) {
    src = line + '\n' + src;
  } else {
    const last = m[m.length - 1];
    const at = last.index + last[0].length;
    src = src.slice(0, at) + '\n' + line + src.slice(at);
  }
  changes++;
  console.log(`${C.ok}✔${C.x} Impor MapDecor ditambahkan`);
}

// ---------------------------------------------------------------------------
// 2. SISIPKAN <MapDecor />
// ---------------------------------------------------------------------------
if (src.includes('<MapDecor')) {
  console.log(`${C.dim}✓${C.x} MapDecor sudah terpasang di scene`);
} else {
  /*
   * Disisipkan setelah <GroundRings />.
   *
   * Titik itu dipilih karena sudah terbukti di Patch 57 — PracticeTower
   * disisipkan di sana dan berhasil. Bila tidak ada, dicoba <Ocean />.
   */
  const anchors = ['<GroundRings />', '<Ocean />'];
  let done = false;

  for (const anchor of anchors) {
    if (!src.includes(anchor)) continue;

    const block = `${anchor}

        {/*
          Hiasan peta — jalur titik emas, panji pulau, cincin awan,
          dan puncak gunung di kejauhan.

          Hanya MEMBACA posisi pulau dari worlds.ts. Formasi cincinnya
          tidak disentuh sama sekali.
        */}
        <MapDecor />`;

    src = src.replace(anchor, block);
    changes++;
    done = true;
    console.log(`${C.ok}✔${C.x} <MapDecor /> disisipkan setelah ${anchor}`);
    break;
  }

  if (!done) {
    console.log(`${C.warn}⚠${C.x}  Titik sisip tidak ditemukan.`);
    console.log(`${C.dim}   Tambahkan <MapDecor /> manual di dalam Scene.${C.x}`);
  }
}

// ---------------------------------------------------------------------------
// 3. PERIKSA SEBELUM MENULIS
// ---------------------------------------------------------------------------
const check = balance(src);
console.log(`\n${C.dim}Pemeriksaan struktur: ${check.report}${C.x}`);

if (!check.ok) {
  console.log(`${C.err}✗${C.x} HASIL TIDAK SEIMBANG — berkas TIDAK ditulis.`);
  console.log(`${C.dim}   Berkas Anda dibiarkan apa adanya.${C.x}\n`);
  process.exit(1);
}
console.log(`${C.ok}✔${C.x} Struktur seimbang`);

if (changes === 0 || src === original) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

const stamp = Date.now();
copyFileSync(path, `${path}.bak-${stamp}`);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}${changes} perubahan diterapkan${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak-${stamp}${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
