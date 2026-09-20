#!/usr/bin/env node
/**
 * fix-readtick.mjs — Mengembalikan perbaikan onReadTick (Patch 63).
 *
 * Jalankan dari ROOT proyek:
 *     node fix-readtick.mjs
 *
 * ====================================================================
 * KENAPA BUG PATCH 60 KEMBALI
 * ====================================================================
 * Ketiga skrip saya sebelumnya memuat baris ini:
 *
 *     if (!existsSync(bak)) copyFileSync(path, bak);
 *
 * Maksudnya baik: jangan timpa cadangan asli. Akibatnya buruk:
 * .bak MEMBEKU di keadaan Patch 59.
 *
 *   Patch 60  .bak dibuat = salinan PRA-60 (masih buggy)
 *   Patch 61  .bak TIDAK diperbarui — masih PRA-60
 *   Patch 62  pulih dari .bak  ->  kembali ke PRA-60
 *
 * Jadi repair-ship.mjs memulihkan berkas ke keadaan SEBELUM perbaikan
 * Patch 60 pernah ada. Galat onReadTick kembali persis seperti semula.
 *
 * ====================================================================
 * SKRIP INI TIDAK MEMAKAI .bak SAMA SEKALI
 * ====================================================================
 * Cadangan dibuat dengan cap waktu (.bak-<angka>), sehingga tidak
 * pernah menimpa maupun memulihkan dari berkas yang sudah basi.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Kembalikan Perbaikan onReadTick${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
let changes = 0;

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

function balanceReport(text) {
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
// 1. Tambahkan onReadTick ke destructuring GateRunner
// ---------------------------------------------------------------------------
const gateBlock = src.match(/function GateRunner\(\{([\s\S]*?)\}:/);

if (!gateBlock) {
  console.log(`${C.err}✗${C.x} Blok destructuring GateRunner tidak ditemukan.`);
  console.log(`${C.dim}  Kirimkan baris sekitar "function GateRunner(" dari ${rel}.${C.x}\n`);
  process.exit(1);
}

if (/\bonReadTick\b/.test(gateBlock[1])) {
  console.log(`${C.dim}✓${C.x} onReadTick sudah ada di destructuring`);
} else {
  const block = gateBlock[1];
  if (!/\bonCross\b/.test(block)) {
    console.log(`${C.err}✗${C.x} onCross tidak ditemukan — format tak terduga.\n`);
    process.exit(1);
  }

  // Sisipkan tepat setelah onCross, menjaga indentasi yang sudah ada.
  const newBlock = block.replace(/(\n(\s*))onCross,/, '$1onCross,$1onReadTick,');
  if (newBlock === block) {
    console.log(`${C.err}✗${C.x} Gagal menyisipkan onReadTick.\n`);
    process.exit(1);
  }

  src = src.replace(block, newBlock);
  changes++;
  console.log(`${C.ok}✔${C.x} onReadTick dikembalikan ke destructuring GateRunner`);
}

// ---------------------------------------------------------------------------
// 2. Jangan telan galat pemrograman di useFrame GateRunner
// ---------------------------------------------------------------------------
const swallow = `    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] SkyRun GateRunner error (diredam):', err);
    }`;

const loud = `    } catch (err) {
      /*
       * Galat PEMROGRAMAN (ReferenceError, TypeError) dilaporkan keras.
       *
       * Patch 59-60 sempat memuat bug di mana prop tidak ter-destructure,
       * sehingga melempar ReferenceError tiap frame. Blok catch yang
       * menelan semuanya membuat bug itu tersembunyi — gejalanya hanya
       * "pesawat macet", tanpa petunjuk apa pun di Console.
       *
       * Galat lain tetap diredam agar satu kesalahan tidak mematikan
       * seluruh scene (pelajaran Patch 15).
       */
      if (err instanceof ReferenceError || err instanceof TypeError) {
        // eslint-disable-next-line no-console
        console.error('[Brightoria] BUG di GateRunner — harap laporkan:', err);
      } else {
        // eslint-disable-next-line no-console
        console.error('[Brightoria] SkyRun GateRunner error (diredam):', err);
      }
    }`;

if (src.includes('BUG di GateRunner')) {
  console.log(`${C.dim}✓${C.x} Pelaporan galat sudah diperbaiki`);
} else if (src.includes(swallow)) {
  src = src.replace(swallow, loud);
  changes++;
  console.log(`${C.ok}✔${C.x} Galat pemrograman kini dilaporkan, bukan ditelan`);
} else {
  console.log(`${C.warn}⚠${C.x}  Blok catch tidak persis cocok — dilewati`);
  console.log(`${C.dim}   (tidak kritis, hanya kualitas pelaporan galat)${C.x}`);
}

// ---------------------------------------------------------------------------
// 3. PERIKSA SEBELUM MENULIS
// ---------------------------------------------------------------------------
const check = balanceReport(src);
console.log(`\n${C.dim}Pemeriksaan struktur: ${check.report}${C.x}`);

if (!check.ok) {
  console.log(`${C.err}✗${C.x} HASIL TIDAK SEIMBANG — berkas TIDAK ditulis.`);
  console.log(`${C.dim}   Berkas Anda dibiarkan apa adanya.${C.x}\n`);
  process.exit(1);
}
console.log(`${C.ok}✔${C.x} Struktur seimbang`);

if (changes === 0) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

/*
 * Cadangan BERCAP WAKTU — tidak pernah menimpa maupun dipulihkan
 * secara otomatis. Inilah perbaikan atas rantai .bak basi.
 */
const stamp = Date.now();
copyFileSync(path, `${path}.bak-${stamp}`);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}${changes} perbaikan diterapkan${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak-${stamp}${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
