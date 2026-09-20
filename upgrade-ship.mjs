#!/usr/bin/env node
/**
 * upgrade-ship.mjs — Memasang kapal & medan asteroid baru (Patch 61).
 *
 * Jalankan dari ROOT proyek:
 *     node upgrade-ship.mjs
 *
 * ====================================================================
 * KENAPA SKRIP, BUKAN MENIMPA SkyRunGame.tsx
 * ====================================================================
 * Berkas SkyRunGame.tsx milik Anda memuat perbaikan `onReadTick` dari
 * Patch 60 yang TIDAK saya pegang salinannya. Menimpanya secara buta
 * akan menghapus perbaikan itu dan membuat pesawat macet lagi.
 *
 * Skrip ini bekerja secara bedah: mencari batas fungsi `Ship` dan
 * `Clouds` dengan MENGHITUNG KURAWAL, lalu menggantinya.
 *
 * Penghitungan kurawal tidak bergantung pada spasi, indentasi, urutan
 * atribut, maupun akhir baris CRLF Windows — pelajaran dari Patch 58,
 * di mana regex yang menuntut tata letak persis gagal di mesin Anda.
 * ====================================================================
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const C = {
  ok: '\x1b[32m', err: '\x1b[31m', warn: '\x1b[33m',
  dim: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m',
};

console.log(`\n${C.b}Brightoria — Pemasangan Kapal & Aset Baru${C.x}`);
console.log(`${C.dim}${ROOT}${C.x}\n`);

const rel = 'src/game/skyrun/SkyRunGame.tsx';
const path = join(ROOT, rel);

if (!existsSync(path)) {
  console.log(`${C.err}✗${C.x} Berkas tidak ada: ${rel}\n`);
  process.exit(1);
}

// Pastikan berkas pendukung sudah disalin lebih dulu.
const needed = [
  'src/game/skyrun/ShipModel.tsx',
  'src/game/skyrun/SpaceField.tsx',
];
const absent = needed.filter((f) => !existsSync(join(ROOT, f)));
if (absent.length > 0) {
  console.log(`${C.err}✗${C.x} Berkas pendukung belum disalin:`);
  absent.forEach((f) => console.log(`${C.dim}    ${f}${C.x}`));
  console.log(`\n${C.dim}  Salin dulu folder src/ dari paket ini.${C.x}\n`);
  process.exit(1);
}

let src = readFileSync(path, 'utf8');
let changes = 0;

/**
 * Mencari batas sebuah deklarasi fungsi dengan menghitung kurawal.
 *
 * Mengembalikan [awal, akhir] atau null bila tidak ditemukan.
 * Tanda kurawal di dalam string dan komentar diabaikan — tanpa itu,
 * sebuah string berisi "{" akan mengacaukan perhitungan.
 */
function findFunction(text, name) {
  const at = text.indexOf(`function ${name}(`);
  if (at === -1) return null;

  const open = text.indexOf('{', at);
  if (open === -1) return null;

  let depth = 0;
  let i = open;
  let state = 'code';

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
      i++;
      continue;
    }

    if (state === 'line') {
      if (c === '\n') state = 'code';
      i++;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && nx === '/') { state = 'code'; i += 2; continue; }
      i++;
      continue;
    }

    // Di dalam string
    const quote = { sq: "'", dq: '"', tpl: '`' }[state];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) state = 'code';
    i++;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 1. Tambahkan impor
// ---------------------------------------------------------------------------
if (src.includes("from './ShipModel'")) {
  console.log(`${C.dim}✓${C.x} Impor ShipModel sudah ada`);
} else {
  /*
   * Mencari baris impor terakhir sebagai titik sisip.
   *
   * Pola sengaja longgar (tidak menuntut titik koma di akhir baris)
   * karena sebagian berkas memakai impor multi-baris. Bila tidak ada
   * sama sekali, impor disisipkan di paling atas — itu selalu sah
   * secara sintaks, jadi lebih baik daripada berhenti dengan galat.
   */
  const m = [...src.matchAll(/^import [^;]+;/gm)];
  const inject =
    "import ShipModel from './ShipModel';\n" +
    "import SpaceField from './SpaceField';\n";

  if (m.length === 0) {
    console.log(`${C.warn}⚠${C.x}  Tidak ada baris impor — disisipkan di paling atas`);
    src = inject + src;
  } else {
    const last = m[m.length - 1];
    const at = last.index + last[0].length;
    src = src.slice(0, at) + '\n' + inject.trimEnd() + src.slice(at);
  }
  changes++;
  console.log(`${C.ok}✔${C.x} Impor ShipModel & SpaceField ditambahkan`);
}

// ---------------------------------------------------------------------------
// 2. Ganti isi fungsi Ship
// ---------------------------------------------------------------------------
if (src.includes('<ShipModel')) {
  console.log(`${C.dim}✓${C.x} Ship sudah memakai ShipModel`);
} else {
  const range = findFunction(src, 'Ship');
  if (!range) {
    console.log(`${C.err}✗${C.x} Fungsi Ship tidak ditemukan.`);
    console.log(`${C.dim}  Kirimkan baris sekitar "function Ship(" dari ${rel}.${C.x}\n`);
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
  console.log(`${C.ok}✔${C.x} Fungsi Ship diganti — kini memakai ShipModel`);
}

// ---------------------------------------------------------------------------
// 3. Ganti fungsi Clouds menjadi SpaceField
// ---------------------------------------------------------------------------
if (src.includes('<SpaceField')) {
  console.log(`${C.dim}✓${C.x} Clouds sudah memakai SpaceField`);
} else {
  const range = findFunction(src, 'Clouds');
  if (!range) {
    console.log(`${C.warn}⚠${C.x}  Fungsi Clouds tidak ditemukan — dilewati`);
    console.log(`${C.dim}   (kapal tetap terpasang, hanya latar yang tidak berubah)${C.x}`);
  } else {
    const replacement = `function Clouds() {
  /*
   * Diganti SpaceField pada Patch 61.
   *
   * Nama fungsi DIPERTAHANKAN agar pemanggilan <Clouds /> di dalam
   * scene tidak perlu diubah — mengubah nama berarti menyentuh lebih
   * banyak baris, dan tiap baris tambahan adalah risiko tambahan.
   */
  return <SpaceField />;
}`;
    src = src.slice(0, range[0]) + replacement + src.slice(range[1]);
    changes++;
    console.log(`${C.ok}✔${C.x} Clouds diganti — kini memakai SpaceField`);
  }
}

// ---------------------------------------------------------------------------
// 4. Latar lebih pekat, sesuai referensi
// ---------------------------------------------------------------------------
const bgOld = `<color attach="background" args={[WORLD.skyMid]} />`;
const bgNew = `{/* Latar biru pekat — mendekati referensi, sekaligus membuat
          bongkahan es-biru jauh lebih menonjol. */}
          <color attach="background" args={['#0a2f6b']} />`;

if (src.includes("'#0a2f6b'")) {
  console.log(`${C.dim}✓${C.x} Latar sudah diperdalam`);
} else if (src.includes(bgOld)) {
  src = src.replace(bgOld, bgNew);
  changes++;
  console.log(`${C.ok}✔${C.x} Latar diperdalam menjadi biru pekat`);
} else {
  console.log(`${C.warn}⚠${C.x}  Baris latar tidak cocok — dilewati`);
}

// ---------------------------------------------------------------------------
if (changes === 0) {
  console.log(`\n${C.dim}Tidak ada yang perlu diubah.${C.x}`);
  console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
  process.exit(0);
}

const bak = path + '.bak';
if (!existsSync(bak)) copyFileSync(path, bak);
writeFileSync(path, src, 'utf8');

console.log(`\n${C.ok}${changes} perubahan diterapkan${C.x}`);
console.log(`${C.dim}cadangan: ${rel}.bak${C.x}`);
console.log(`\n${C.b}Berikutnya:${C.x} npm run build\n`);
process.exit(0);
