#!/usr/bin/env node
/**
 * flow-fix.mjs — Alur menerus + tombol tembak (Patch 66).
 *
 * Jalankan dari ROOT proyek:
 *     node flow-fix.mjs
 *
 * ====================================================================
 * MASALAH: TERASA SEPERTI GANTI SLIDE
 * ====================================================================
 * Umpan balik: "kl pas setelah jawab, bukan kayak mulai dari awal kek
 * slide selanjutnya, tapi terus jalan".
 *
 * Penyebabnya satu baris:
 *
 *     paused={phase !== 'flying'}
 *
 * Setelah anak menjawab, fase berubah menjadi 'between'. Karena
 * 'between' bukan 'flying', gerbang langsung MEMBEKU di tempat —
 * lalu muncul lagi dari kejauhan saat soal berikutnya.
 *
 * Itulah yang terbaca sebagai pergantian slide: ada jeda mati, lalu
 * mulai dari awal.
 *
 * PERBAIKAN
 * Biarkan gerbang terus melaju selama fase umpan balik:
 *
 *     paused={phase !== 'flying' && phase !== 'between'}
 *
 * Gerbang yang sudah dijawab melintas terus melewati kamera sementara
 * anak membaca umpan baliknya, lalu gerbang berikutnya datang dari
 * kejauhan. Penerbangan tidak pernah berhenti.
 *
 * ====================================================================
 * TAMBAHAN: TOMBOL TEMBAK MENGUNCI JAWABAN
 * ====================================================================
 * Ditambahkan pendengar event 'brightoria:skyrun-lock'. Saat anak
 * menekan tombol Tembak, jawaban jalur yang sedang ditempati langsung
 * dikunci — tanpa menunggu gerbang tiba.
 *
 * Itu yang membuat tombolnya punya MAKNA. Tombol yang hanya
 * menghasilkan kilatan cahaya akan terasa palsu, dan anak akan
 * berhenti menekannya.
 *
 * ====================================================================
 * SELALU MEMERIKSA SEBELUM MENULIS
 * ====================================================================
 * Pelajaran Patch 61: uji yang hanya memeriksa keberadaan string
 * meloloskan kerusakan struktural. Skrip ini memeriksa keseimbangan
 * kurung SEBELUM menyimpan — bila tidak seimbang, berkas tidak
 * disentuh sama sekali.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Alur Menerus + Tombol Tembak${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

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

let src = readFileSync(path, 'utf8');
let changes = 0;

// ---------------------------------------------------------------------------
// 1. ALUR MENERUS — gerbang tidak membeku saat umpan balik
// ---------------------------------------------------------------------------
const pausedOld = `paused={phase !== 'flying'}`;
const pausedNew = `paused={phase !== 'flying' && phase !== 'between'}`;

if (src.includes(pausedNew)) {
  console.log(`${C.dim}✓${C.x} Alur menerus sudah aktif`);
} else if (src.includes(pausedOld)) {
  src = src.replace(pausedOld, pausedNew);
  changes++;
  console.log(`${C.ok}✔${C.x} Gerbang kini terus melaju saat umpan balik`);
  console.log(`${C.dim}   tidak lagi terasa seperti ganti slide${C.x}`);
} else {
  console.log(`${C.warn}⚠${C.x}  Baris 'paused' tidak cocok — dilewati`);
  console.log(`${C.dim}   Kirimkan baris sekitar "<GateRunner" agar saya sesuaikan.${C.x}`);
}

// ---------------------------------------------------------------------------
// 2. TOMBOL TEMBAK MENGUNCI JAWABAN
// ---------------------------------------------------------------------------
if (src.includes('skyrun-lock')) {
  console.log(`${C.dim}✓${C.x} Pendengar tombol tembak sudah ada`);
} else {
  /*
   * Disisipkan tepat sebelum `const setLane`.
   *
   * Titik itu dipilih karena berada di dalam komponen utama, setelah
   * seluruh state dideklarasikan, tapi sebelum fungsi-fungsi penangan.
   * Jadi `phase` dan `laneRef` pasti sudah tersedia.
   */
  const anchor = '  const setLane = useCallback(';

  if (!src.includes(anchor)) {
    console.log(`${C.warn}⚠${C.x}  Titik sisip tidak ditemukan — dilewati`);
    console.log(`${C.dim}   Tombol tembak tetap berfungsi sebagai tembakan visual.${C.x}`);
  } else {
    const listener = `  /**
   * Tombol Tembak mengunci jawaban jalur yang sedang ditempati.
   *
   * Tanpa ini, tombolnya hanya menghasilkan kilatan cahaya — dan
   * anak akan segera berhenti menekannya karena terasa palsu.
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
    src = src.replace(anchor, listener + anchor);
    changes++;
    console.log(`${C.ok}✔${C.x} Tombol tembak kini mengunci jawaban`);
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

if (changes === 0) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

// Cadangan bercap waktu — tidak pernah menimpa maupun dipulihkan
// otomatis. Perbaikan atas rantai .bak basi di Patch 60-63.
const stamp = Date.now();
copyFileSync(path, `${path}.bak-${stamp}`);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}${changes} perubahan diterapkan${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak-${stamp}${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
