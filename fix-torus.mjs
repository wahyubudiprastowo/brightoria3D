#!/usr/bin/env node
/**
 * fix-torus.mjs — Perbaikan build error TS2322 (Patch 59).
 *
 * Jalankan dari ROOT proyek:
 *     node fix-torus.mjs
 *
 * ====================================================================
 * KENAPA SKRIP PATCH 58 GAGAL
 * ====================================================================
 * Skrip sebelumnya memakai regex yang menuntut <mesh> dan
 * <torusGeometry> berada di dua baris berurutan dengan spasi persis:
 *
 *     /<mesh position=\{\[0, 0\.052, 0\]\}>\s*\n(\s*)<torusGeometry .../
 *
 * Itu terlalu kaku. Cukup satu perbedaan — spasi, urutan atribut, atau
 * akhir baris CRLF Windows — dan pola tidak cocok.
 *
 * Versi ini memakai pendekatan yang jauh lebih kokoh:
 *
 *   1. Cari SEMUA <torusGeometry ...> yang memuat `rotation=`
 *   2. Dari tiap temuan, MUNDUR cari tag <mesh ...> terdekat
 *   3. Pindahkan rotation ke tag <mesh> itu
 *
 * Tidak bergantung pada spasi, urutan baris, maupun akhir baris.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = { ok:'\x1b[32m', err:'\x1b[31m', warn:'\x1b[33m', dim:'\x1b[2m', b:'\x1b[1m', x:'\x1b[0m' };

console.log(`\n${C.b}Brightoria — Perbaikan Build Error TS2322${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/components/world3d/outfits.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}`);
  console.log(`${C.dim}  Pastikan Patch 56 sudah dipasang.${C.x}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
const before = src;

/**
 * Memindahkan prop `rotation` dari <xxxGeometry> ke <mesh> terdekat
 * di atasnya.
 *
 * Dikerjakan berulang sampai tidak ada lagi yang tersisa — sebuah
 * berkas bisa saja memuat lebih dari satu kesalahan yang sama.
 */
function moveRotationToMesh(text) {
  let fixed = 0;
  let guard = 0;

  while (guard++ < 30) {
    // 1. Cari geometry yang memuat rotation
    const geo = /<(\w*[Gg]eometry)\b([^>]*?)\srotation=(\{\[[^\]]*\]\})([^>]*?)\/>/;
    const m = text.match(geo);
    if (!m) break;

    const [full, tag, pre, rotVal, post] = m;
    const at = m.index;

    // 2. Mundur cari <mesh ...> terdekat yang BELUM ditutup
    const head = text.slice(0, at);
    const meshAt = head.lastIndexOf('<mesh');
    if (meshAt === -1) break;

    const meshEnd = text.indexOf('>', meshAt);
    if (meshEnd === -1 || meshEnd > at) break;

    const meshTag = text.slice(meshAt, meshEnd + 1);

    // Bila <mesh> sudah punya rotation, cukup buang dari geometry —
    // menimpa rotation milik mesh justru bisa merusak tampilan.
    const meshHasRotation = /\srotation=/.test(meshTag);

    const newGeo = `<${tag}${pre}${post}/>`;
    const newMesh = meshHasRotation
      ? meshTag
      : meshTag.replace(/>$/, ` rotation=${rotVal}>`);

    text =
      text.slice(0, meshAt) +
      newMesh +
      text.slice(meshEnd + 1, at) +
      newGeo +
      text.slice(at + full.length);

    fixed++;
  }

  return { text, fixed };
}

const result = moveRotationToMesh(src);

if (result.fixed === 0) {
  if (/<\w*[Gg]eometry[^>]*\srotation=/.test(src)) {
    console.log(`${C.err}✗${C.x} Masih ada geometry ber-rotation tapi gagal diperbaiki.`);
    console.log(`${C.dim}  Kirimkan isi ${rel} baris 270-285 agar saya sesuaikan.${C.x}\n`);
    process.exit(1);
  }
  console.log(`${C.dim}✓${C.x} Sudah benar — tidak ada geometry ber-rotation.`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

// Cadangan sebelum menulis
const bak = path + '.bak';
if (!existsSync(bak)) copyFileSync(path, bak);
writeFileSync(path, result.text, 'utf8');

console.log(`${C.ok}✔${C.x} ${result.fixed} geometry diperbaiki`);
console.log(`${C.dim}   rotation dipindahkan ke <mesh>, tempat yang benar${C.x}`);
console.log(`${C.dim}   cadangan: ${rel}.bak${C.x}`);

// Bukti singkat untuk pengguna
const lines = result.text.split('\n');
lines.forEach((l, i) => {
  if (l.includes('torusGeometry')) {
    console.log(`${C.dim}\n   baris ${i + 1}: ${l.trim().slice(0, 64)}${C.x}`);
    const prev = lines[i - 1];
    if (prev) console.log(`${C.dim}   baris ${i}: ${prev.trim().slice(0, 64)}${C.x}`);
  }
});

console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
