#!/usr/bin/env node
/**
 * repair-ship.mjs — Memperbaiki kerusakan dari Patch 61 (Patch 62).
 *
 * Jalankan dari ROOT proyek:
 *     node repair-ship.mjs
 *
 * ====================================================================
 * APA YANG RUSAK, DAN KENAPA
 * ====================================================================
 * Skrip Patch 61 mencari batas fungsi dengan menghitung kurawal,
 * dimulai dari kurawal PERTAMA setelah nama fungsi:
 *
 *     const open = text.indexOf('{', at);
 *
 * Untuk fungsi tanpa destructuring itu benar:
 *
 *     function Clouds() {        <- kurawal pertama = badan fungsi
 *
 * Tapi komponen React memakai destructuring:
 *
 *     function Ship({ laneRef }: { laneRef: LaneRef }) {
 *                   ^^^^^^^^^^^ kurawal pertama ada DI SINI
 *
 * Jadi penghitungan dimulai dari kurawal destructuring, dan berakhir
 * di kurawal penutupnya. Skrip mengira "seluruh fungsi" hanyalah
 * `function Ship({ laneRef }` — lalu menggantinya, dan meninggalkan
 * sisanya sebagai sampah:
 *
 *     function Ship(...) { BADAN_BARU }: { laneRef: LaneRef }) {
 *       BADAN_LAMA
 *     }
 *
 * Itulah galat TS1128 di baris 594.
 *
 * ====================================================================
 * DUA PERBAIKAN
 * ====================================================================
 * 1. LEWATI DAFTAR PARAMETER LEBIH DULU.
 *    Hitung tanda kurung dari `(` sampai pasangannya, BARU cari
 *    kurawal badan fungsi sesudah itu.
 *
 * 2. PERIKSA HASILNYA SEBELUM MENULIS.
 *    Inilah jaring pengaman yang tidak ada di Patch 61. Sebelum
 *    menyimpan, seluruh berkas diperiksa keseimbangan kurawal,
 *    kurung, dan sikunya. Bila tidak seimbang, berkas TIDAK ditulis.
 *
 *    Uji Patch 61 hanya memeriksa keberadaan string — itu sebabnya
 *    kerusakan struktural lolos begitu saja.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Perbaikan Kerusakan Patch 61${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);
const bakPath = path + '.bak';

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// ALAT: pembaca yang sadar string & komentar
// ---------------------------------------------------------------------------

/**
 * Membuang isi string dan komentar, menyisakan kerangka kode.
 *
 * Tanpa ini, sebuah string berisi "{" akan mengacaukan seluruh
 * perhitungan keseimbangan.
 */
function stripLiterals(src) {
  const out = [];
  let i = 0;
  let state = 'code';

  while (i < src.length) {
    const c = src[i];
    const nx = src[i + 1];

    if (state === 'code') {
      if (c === '/' && nx === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && nx === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      out.push(c); i++; continue;
    }

    if (state === 'line') {
      if (c === '\n') { state = 'code'; out.push(c); }
      i++; continue;
    }

    if (state === 'block') {
      if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; }
      i++; continue;
    }

    const quote = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) state = 'code';
    i++;
  }

  return out.join('');
}

/** Benar bila seluruh berkas seimbang kurawal, kurung, dan sikunya. */
function isBalanced(src) {
  const s = stripLiterals(src);
  const pairs = [['{', '}'], ['(', ')'], ['[', ']']];
  const report = [];

  for (const [o, c] of pairs) {
    const a = s.split(o).length - 1;
    const b = s.split(c).length - 1;
    report.push(`${o}${c} ${a}/${b}`);
    if (a !== b) return { ok: false, report: report.join('  ') };
  }
  return { ok: true, report: report.join('  ') };
}

/**
 * Mencari batas deklarasi fungsi — VERSI DIPERBAIKI.
 *
 * Berbeda dari Patch 61: daftar parameter dilewati lebih dulu dengan
 * menghitung tanda kurung, BARU kurawal badan fungsi dicari.
 */
function findFunction(text, name) {
  const sig = `function ${name}(`;
  const at = text.indexOf(sig);
  if (at === -1) return null;

  // --- Tahap 1: lewati daftar parameter ---
  let i = at + sig.length - 1;   // posisi '('
  let depth = 0;
  let state = 'code';
  let paramEnd = -1;

  while (i < text.length) {
    const c = text[i];
    const nx = text[i + 1];

    if (state === 'code') {
      if (c === '/' && nx === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && nx === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      if (c === '(') depth++;
      if (c === ')') {
        depth--;
        if (depth === 0) { paramEnd = i; break; }
      }
      i++; continue;
    }

    if (state === 'line') {
      if (c === '\n') state = 'code';
      i++; continue;
    }

    if (state === 'block') {
      if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; }
      i++; continue;
    }

    const quote = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) state = 'code';
    i++;
  }

  if (paramEnd === -1) return null;

  // --- Tahap 2: cari kurawal badan fungsi ---
  const open = text.indexOf('{', paramEnd);
  if (open === -1) return null;

  // --- Tahap 3: hitung kurawal badan fungsi ---
  depth = 0;
  i = open;
  state = 'code';

  while (i < text.length) {
    const c = text[i];
    const nx = text[i + 1];

    if (state === 'code') {
      if (c === '/' && nx === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && nx === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      if (c === '{') depth++;
      if (c === '}') {
        depth--;
        if (depth === 0) return [at, i + 1];
      }
      i++; continue;
    }

    if (state === 'line') {
      if (c === '\n') state = 'code';
      i++; continue;
    }

    if (state === 'block') {
      if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; }
      i++; continue;
    }

    const quote = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) state = 'code';
    i++;
  }

  return null;
}

// ---------------------------------------------------------------------------
// LANGKAH 1: pulihkan berkas
// ---------------------------------------------------------------------------

let src = readFileSync(path, 'utf8');
const damaged = !isBalanced(src).ok;

if (damaged) {
  console.log(`${C.warn}⚠${C.x}  Berkas rusak terdeteksi`);

  if (existsSync(bakPath)) {
    const bak = readFileSync(bakPath, 'utf8');
    const bakCheck = isBalanced(bak);

    if (!bakCheck.ok) {
      console.log(`${C.err}✗${C.x} Cadangan .bak juga rusak.`);
      console.log(`${C.dim}   ${bakCheck.report}${C.x}\n`);
      process.exit(1);
    }

    src = bak;
    console.log(`${C.ok}✔${C.x} Dipulihkan dari ${rel}.bak`);
    console.log(`${C.dim}   perbaikan onReadTick Patch 60 ikut kembali${C.x}`);
  } else {
    console.log(`${C.err}✗${C.x} Cadangan .bak tidak ditemukan.`);
    console.log(`${C.dim}   Tanpa cadangan, saya tidak bisa memulihkan dengan aman.`);
    console.log(`${C.dim}   Kirimkan isi ${rel} agar saya perbaiki manual.${C.x}\n`);
    process.exit(1);
  }
} else {
  console.log(`${C.dim}✓${C.x} Berkas tidak rusak`);
}

// ---------------------------------------------------------------------------
// LANGKAH 2: pasang ulang dengan logika yang benar
// ---------------------------------------------------------------------------

const needed = [
  'src/game/skyrun/ShipModel.tsx',
  'src/game/skyrun/SpaceField.tsx',
];
const absent = needed.filter((f) => !existsSync(join(ROOT, f)));
if (absent.length > 0) {
  console.log(`\n${C.err}✗${C.x} Berkas pendukung belum disalin:`);
  absent.forEach((f) => console.log(`${C.dim}    ${f}${C.x}`));
  console.log(`\n${C.dim}  Salin dulu folder src/ dari paket Patch 61.${C.x}\n`);
  process.exit(1);
}

let changes = 0;

// --- Impor ---
if (src.includes("from './ShipModel'")) {
  console.log(`${C.dim}✓${C.x} Impor sudah ada`);
} else {
  const m = [...src.matchAll(/^import [^;]+;/gm)];
  const inject =
    "import ShipModel from './ShipModel';\n" +
    "import SpaceField from './SpaceField';\n";

  if (m.length === 0) {
    src = inject + src;
  } else {
    const last = m[m.length - 1];
    const at2 = last.index + last[0].length;
    src = src.slice(0, at2) + '\n' + inject.trimEnd() + src.slice(at2);
  }
  changes++;
  console.log(`${C.ok}✔${C.x} Impor ditambahkan`);
}

// --- Fungsi Ship ---
if (src.includes('<ShipModel')) {
  console.log(`${C.dim}✓${C.x} Ship sudah memakai ShipModel`);
} else {
  const range = findFunction(src, 'Ship');
  if (!range) {
    console.log(`${C.err}✗${C.x} Fungsi Ship tidak ditemukan.\n`);
    process.exit(1);
  }

  const replacement = `function Ship({ laneRef }: { laneRef: LaneRef }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const currentX = useRef(0);

  /**
   * Dorongan mesin, 0-1.
   *
   * Disimpan di ref, bukan state: nilainya berubah tiap frame, dan
   * lewat useState itu berarti 60 render ulang per detik.
   */
  const thrust = useRef(1);
  const quality = getQuality();

  useFrame((state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      if (!group.current) return;

      const targetX = LANE_X[laneRef.current] ?? 0;
      const prevX = currentX.current;
      currentX.current += (targetX - prevX) * Math.min(1, dt * 7.5);

      const t = state.clock.elapsedTime;
      group.current.position.x = currentX.current;
      group.current.position.y = -0.9 + Math.sin(t * 1.9) * 0.09;

      // Mesin menyala lebih besar saat sedang bermanuver.
      const moving = Math.abs(targetX - currentX.current);
      thrust.current = 1 + Math.min(0.5, moving * 0.28);

      if (body.current && quality.motion) {
        /*
         * Kemiringan dihitung dari SELISIH posisi, bukan dari tombol
         * yang ditekan. Dengan begitu kapal memiringkan badan selama
         * masih bergerak, lalu meluruskan diri saat sampai — itulah
         * yang membuat manuver terasa punya bobot.
         */
        const offset = targetX - currentX.current;
        const bank = THREE.MathUtils.clamp(offset * 0.32, -0.7, 0.7);
        body.current.rotation.z +=
          (bank - body.current.rotation.z) * Math.min(1, dt * 8);
        body.current.rotation.y = -bank * 0.32;
        body.current.rotation.x = Math.sin(t * 2.3) * 0.03;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] SkyRun Ship error (diredam):', err);
    }
  });

  return (
    <group ref={group} position={[0, -0.9, 3.4]}>
      <group ref={body}>
        <ShipModel thrustRef={thrust} />
      </group>
    </group>
  );
}`;

  src = src.slice(0, range[0]) + replacement + src.slice(range[1]);
  changes++;
  console.log(`${C.ok}✔${C.x} Fungsi Ship diganti`);
}

// --- Fungsi Clouds ---
if (src.includes('<SpaceField')) {
  console.log(`${C.dim}✓${C.x} Clouds sudah memakai SpaceField`);
} else {
  const range = findFunction(src, 'Clouds');
  if (!range) {
    console.log(`${C.warn}⚠${C.x}  Fungsi Clouds tidak ditemukan — dilewati`);
  } else {
    const replacement = `function Clouds() {
  /*
   * Diganti SpaceField pada Patch 61.
   *
   * Nama fungsi DIPERTAHANKAN agar pemanggilan <Clouds /> di dalam
   * scene tidak perlu diubah.
   */
  return <SpaceField />;
}`;
    src = src.slice(0, range[0]) + replacement + src.slice(range[1]);
    changes++;
    console.log(`${C.ok}✔${C.x} Clouds diganti`);
  }
}

// --- Latar ---
const bgOld = `<color attach="background" args={[WORLD.skyMid]} />`;
if (src.includes("'#0a2f6b'")) {
  console.log(`${C.dim}✓${C.x} Latar sudah diperdalam`);
} else if (src.includes(bgOld)) {
  src = src.replace(
    bgOld,
    `{/* Latar biru pekat — membuat bongkahan es-biru lebih menonjol. */}
          <color attach="background" args={['#0a2f6b']} />`,
  );
  changes++;
  console.log(`${C.ok}✔${C.x} Latar diperdalam`);
}

// ---------------------------------------------------------------------------
// LANGKAH 3: PERIKSA SEBELUM MENULIS  <- jaring pengaman Patch 61
// ---------------------------------------------------------------------------

const check = isBalanced(src);

console.log(`\n${C.dim}Pemeriksaan struktur: ${check.report}${C.x}`);

if (!check.ok) {
  console.log(`${C.err}✗${C.x} HASIL TIDAK SEIMBANG — berkas TIDAK ditulis.`);
  console.log(`${C.dim}   Berkas Anda dibiarkan apa adanya, tidak dirusak lagi.`);
  console.log(`${C.dim}   Kirimkan laporan ini agar saya perbaiki.${C.x}\n`);
  process.exit(1);
}

console.log(`${C.ok}✔${C.x} Struktur seimbang`);

if (changes === 0 && !damaged) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

writeFileSync(path, src, 'utf8');
console.log(`\n${C.ok}Selesai${C.x} ${C.dim}(${changes} perubahan)${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
