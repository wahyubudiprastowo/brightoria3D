#!/usr/bin/env node
/**
 * fix-skyrun.mjs — Perbaikan build error TS2304 + pesawat macet (Patch 60).
 *
 * Jalankan dari ROOT proyek:
 *     node fix-skyrun.mjs
 *
 * ====================================================================
 * SATU BUG, DUA GEJALA
 * ====================================================================
 * Pada Patch 59 saya menambahkan `onReadTick` ke ANOTASI TIPE
 * GateRunner, tapi lupa menambahkannya ke POLA DESTRUCTURING.
 *
 * Jadi fungsinya terbaca begini:
 *
 *     function GateRunner({
 *       question, laneStates, paused, onCross,   <- onReadTick TIDAK ADA
 *     }: {
 *       ...
 *       onReadTick: (remaining: number) => void;  <- hanya di tipe
 *     }) {
 *
 * GEJALA 1 — build gagal:
 *     TS2304: Cannot find name 'onReadTick'
 *
 * GEJALA 2 — pesawat macet:
 *     Saat dev server berjalan (yang tidak memeriksa tipe), panggilan
 *     onReadTick melempar ReferenceError di dalam useFrame. Blok
 *     try/catch milik saya sendiri MENELAN galat itu diam-diam.
 *
 *     Akibatnya tiap frame: hitung mundur baca, lempar galat, keluar.
 *     Setelah 2,6 detik, onReadTick(0) juga melempar — sehingga baris
 *     `zRef.current += GATE_SPEED * dt` TIDAK PERNAH tercapai.
 *
 *     Gerbang tidak pernah bergerak. Bilah "Baca dulu..." diam
 *     selamanya. Persis yang terlihat di layar Anda.
 *
 * ====================================================================
 * PELAJARAN: try/catch YANG TERLALU LUAS
 * ====================================================================
 * Saya membungkus useFrame dengan try/catch untuk mencegah satu galat
 * mematikan seluruh scene (pelajaran Patch 15). Itu benar.
 *
 * Tapi menelan galat TANPA membedakan jenisnya membuat bug pemrograman
 * seperti ini tersembunyi. Skrip ini sekaligus memperbaiki itu:
 * ReferenceError dan TypeError kini dilaporkan ke Console, bukan
 * ditelan diam-diam.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = { ok:'\x1b[32m', err:'\x1b[31m', warn:'\x1b[33m', dim:'\x1b[2m', b:'\x1b[1m', x:'\x1b[0m' };

console.log(`\n${C.b}Brightoria — Perbaikan Pesawat Macet (TS2304)${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
const before = src;
let fixed = 0;

// ---------------------------------------------------------------------------
// 1. Tambahkan onReadTick ke destructuring GateRunner
// ---------------------------------------------------------------------------
if (/function GateRunner\(\{[^}]*\bonReadTick\b/s.test(src)) {
  console.log(`${C.dim}✓${C.x} onReadTick sudah ada di destructuring`);
} else {
  /*
   * Pola: cari `onCross,` di dalam blok destructuring GateRunner,
   * lalu sisipkan `onReadTick,` sesudahnya.
   *
   * Dibatasi pada blok GateRunner saja agar tidak menyentuh komponen
   * lain yang kebetulan juga punya prop onCross.
   */
  const m = src.match(/function GateRunner\(\{([\s\S]*?)\}:/);
  if (!m) {
    console.log(`${C.err}✗${C.x} Blok destructuring GateRunner tidak ditemukan.`);
    console.log(`${C.dim}  Kirimkan baris 690-720 dari ${rel}.${C.x}\n`);
    process.exit(1);
  }

  const block = m[1];
  if (!/\bonCross\b/.test(block)) {
    console.log(`${C.err}✗${C.x} onCross tidak ditemukan di destructuring.\n`);
    process.exit(1);
  }

  // Sisipkan tepat setelah onCross, menjaga indentasi yang sudah ada.
  const newBlock = block.replace(
    /(\n(\s*))onCross,/,
    '$1onCross,$1onReadTick,'
  );

  if (newBlock === block) {
    console.log(`${C.err}✗${C.x} Gagal menyisipkan — format destructuring tak terduga.\n`);
    process.exit(1);
  }

  src = src.replace(block, newBlock);
  fixed++;
  console.log(`${C.ok}✔${C.x} onReadTick ditambahkan ke destructuring GateRunner`);
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
       * Patch 59 sempat memuat bug di mana prop tidak ter-destructure,
       * sehingga melempar ReferenceError tiap frame. Blok catch yang
       * menelan semuanya membuat bug itu tersembunyi berhari-hari —
       * gejalanya hanya "pesawat macet", tanpa petunjuk apa pun.
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
  fixed++;
  console.log(`${C.ok}✔${C.x} Galat pemrograman kini dilaporkan, bukan ditelan`);
} else {
  console.log(`${C.warn}⚠${C.x}  Blok catch GateRunner tidak persis cocok — dilewati`);
  console.log(`${C.dim}   (tidak kritis, hanya kualitas pelaporan galat)${C.x}`);
}

// ---------------------------------------------------------------------------
if (fixed === 0) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

const bak = path + '.bak';
if (!existsSync(bak)) copyFileSync(path, bak);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}${fixed} perbaikan diterapkan${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak${C.x}`);

// Bukti singkat
const lines = src.split('\n');
const at = lines.findIndex((l) => /function GateRunner\(\{/.test(l));
if (at >= 0) {
  console.log(`${C.dim}\n   destructuring GateRunner:${C.x}`);
  for (let i = at; i < Math.min(at + 7, lines.length); i++) {
    const mark = lines[i].includes('onReadTick') ? `${C.ok}  <--${C.x}` : '';
    console.log(`${C.dim}   ${i + 1}: ${lines[i].trim().slice(0, 40)}${C.x}${mark}`);
  }
}

console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
