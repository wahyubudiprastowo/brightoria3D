import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Headphones,
  LoaderCircle,
  Lock,
  Pause,
  Search,
  Volume2,
} from 'lucide-react';
import { IQRA_1_PAGES } from './iqraBook1Data';
import { IQRA_2_PAGES } from './iqraBook2Data';
import { IQRA_3_PAGES } from './iqraBook3Data';
import { IQRA_4_PAGES } from './iqraBook4Data';
import { IQRA_5_PAGES } from './iqraBook5Data';
import { IQRA_6_PAGES } from './iqraBook6Data';
import { speakArabic } from './quranTts';
import {
  getAyahAudioUrl,
  JUZ_30_SURAHS,
  loadJuz30,
  type Juz30SurahMeta,
  type QuranAyah,
} from './quranReaderData';

const JUZ30_PROGRESS_KEY = 'brightoria.quran.juz30.reader.v1';

export type IqraJilid = 1 | 2 | 3 | 4 | 5 | 6;

const IQRA_BOOKS = {
  1: IQRA_1_PAGES,
  2: IQRA_2_PAGES,
  3: IQRA_3_PAGES,
  4: IQRA_4_PAGES,
  5: IQRA_5_PAGES,
  6: IQRA_6_PAGES,
} as const;

const IQRA_BOOK_DESCRIPTIONS: Record<IqraJilid, string> = {
  1: 'Huruf hijaiyah tunggal dan fathah dasar',
  2: 'Huruf sambung dan bacaan panjang fathah',
  3: 'Kasrah, dhammah, dan mad ya/wau',
  4: 'Tanwin, sukun, qalqalah, dan latihan sambungan',
  5: 'Alif lam, tasydid, mad, dan bacaan mushaf',
  6: 'Tajwid dasar, tanda waqaf, gharib, dan tartil',
};

function iqraProgressKey(jilid: IqraJilid) {
  return `brightoria.quran.iqra${jilid}.pages.v1`;
}

const READER_CSS = `
.quran-full-reader { display:grid; gap:12px; color:#17403a; min-height:0; flex:0 0 auto; }
.quran-reader-toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding:12px; border:1px solid #cdeadf; border-radius:16px; background:linear-gradient(135deg,#f6fff9,#fff7df); }
.quran-reader-toolbar h3 { margin:0; font-size:18px; }
.quran-reader-toolbar p { margin:3px 0 0; color:#55736b; font-size:11px; }
.quran-reader-stat { display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border-radius:999px; background:#dff3ea; color:#126153; font-size:11px; font-weight:900; }
.quran-reader-layout { display:grid; grid-template-columns:minmax(210px, .72fr) minmax(0, 1.8fr); gap:12px; min-height:0; }
.quran-reader-sidebar { border:1px solid #dceee7; border-radius:16px; background:#ffffffcc; padding:10px; max-height:62vh; overflow:auto; }
.quran-reader-search { position:sticky; top:-10px; z-index:2; display:flex; align-items:center; gap:7px; margin:-2px -2px 8px; padding:8px; border:1px solid #cdeadf; border-radius:11px; background:#fff; }
.quran-reader-search input { width:100%; border:0; outline:0; color:#17403a; font:inherit; font-size:12px; background:transparent; }
.quran-surah-list { display:grid; gap:6px; }
.quran-surah-choice { display:grid; grid-template-columns:32px minmax(0,1fr) auto; align-items:center; gap:8px; width:100%; border:1px solid #e0eee8; border-radius:12px; padding:8px; background:#fff; color:#17403a; text-align:left; cursor:pointer; font:inherit; }
.quran-surah-choice:hover,.quran-surah-choice.active { border-color:#58bea5; background:#eaf8f1; }
.quran-surah-number { display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:#17403a; color:#fff; font-size:10px; font-weight:900; }
.quran-surah-choice b { display:block; font-size:12px; }
.quran-surah-choice small { display:block; color:#648078; font-size:9px; margin-top:2px; }
.quran-surah-choice .arabic { font-family:'Noto Naskh Arabic','Amiri',serif; direction:rtl; font-size:16px; }
.quran-reader-content { border:1px solid #dceee7; border-radius:16px; background:#ffffffde; padding:14px; max-height:62vh; overflow:auto; }
.quran-reader-empty { min-height:280px; display:grid; place-items:center; text-align:center; color:#648078; }
.quran-surah-heading { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid #dceee7; }
.quran-surah-heading h3 { margin:0; font-size:20px; }
.quran-surah-heading p { margin:2px 0 0; color:#648078; font-size:11px; }
.quran-audio-actions { display:flex; flex-wrap:wrap; gap:7px; }
.quran-audio-btn { border:1px solid #bfe0d6; background:#fff; color:#126153; min-height:36px; border-radius:11px; padding:7px 10px; display:inline-flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; font:inherit; font-size:11px; font-weight:900; }
.quran-audio-btn.primary { color:#fff; border-color:#126153; background:#17856f; }
.quran-audio-btn.playing { color:#fff; border-color:#d69a2f; background:#d69a2f; }
.quran-audio-btn:disabled { opacity:.55; cursor:not-allowed; }
.quran-audio-note { margin:9px 0 0; padding:8px 10px; border-radius:10px; background:#fff4d3; color:#785820; font-size:10px; line-height:1.4; }
.quran-reader-error { margin:9px 0 0; color:#a33d30; font-size:11px; font-weight:800; }
.quran-ayah-list { display:grid; gap:8px; margin-top:12px; }
.quran-ayah-row { border:1px solid #e5eee9; border-radius:14px; padding:12px; background:#fffdfa; transition:border-color .15s, box-shadow .15s; }
.quran-ayah-row.playing { border-color:#e0aa42; box-shadow:0 0 0 3px #f6d68a55; }
.quran-ayah-top { display:flex; align-items:flex-start; gap:10px; }
.quran-ayah-index { display:grid; place-items:center; flex:0 0 30px; height:30px; border-radius:50%; background:#e6f3ee; color:#126153; font-size:10px; font-weight:900; }
.quran-ayah-main { min-width:0; flex:1; }
.quran-ayah-text { direction:rtl; text-align:right; font-family:'Noto Naskh Arabic','Amiri',serif; font-size:25px; line-height:1.9; color:#173d37; }
.quran-ayah-latin { margin-top:6px; color:#4f6d65; font-size:11px; line-height:1.45; }
.quran-ayah-meaning { margin-top:5px; color:#745f45; font-size:11px; line-height:1.45; }
.quran-ayah-play { flex:0 0 auto; width:34px; height:34px; padding:0; border-radius:50%; }
.iqra-book-tabs { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:7px; padding:4px; }
.iqra-book-tab { min-height:50px; border:1px solid #cdeadf; border-radius:12px; background:#fff; color:#17403a; cursor:pointer; font:inherit; font-size:11px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:5px; }
.iqra-book-tab:hover,.iqra-book-tab.active { border-color:#17856f; background:#eaf8f1; }
.iqra-book-tab.active { color:#fff; background:#17856f; }
.iqra-book-tab.locked { color:#856f45; background:#fff8e8; border-color:#ead5a5; }
.iqra-book-access-note { margin:0; padding:8px 11px; border:1px solid #efdfba; border-radius:11px; background:#fff8e8; color:#735a2d; font-size:10px; line-height:1.45; }
.iqra-page-tabs { display:flex; flex-wrap:wrap; gap:6px; max-height:130px; overflow:auto; padding:3px; }
.iqra-page-tab { width:38px; height:34px; border:1px solid #cdeadf; border-radius:10px; background:#fff; color:#17403a; cursor:pointer; font-weight:900; }
.iqra-page-tab.active { background:#17856f; color:#fff; border-color:#17856f; }
.iqra-page-tab.done:not(.active) { background:#e4f5ec; color:#126153; }
.iqra-book-page { display:grid; gap:12px; min-height:min(440px,58vh); }
.iqra-page-heading { position:static !important; z-index:auto; display:grid !important; grid-template-columns:minmax(0,1fr); justify-items:center; align-items:initial; gap:4px; width:100%; height:auto !important; min-height:0; padding:0 0 12px !important; text-align:center; border:0; border-bottom:1px solid #dceee7; background:transparent; backdrop-filter:none; }
.iqra-page-heading h3 { margin:0 0 4px; font-size:19px; }
.iqra-page-heading p { margin:0; color:#59756e; font-size:11px; line-height:1.45; }
.iqra-preview { margin-top:10px; font-family:'Noto Naskh Arabic','Amiri',serif; direction:rtl; font-size:30px; color:#17403a; }
.iqra-rows { display:grid; gap:8px; }
.iqra-row { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; padding:8px; border-radius:13px; background:#fffaf2; border:1px solid #eadfc8; }
.iqra-item { border:1px solid #dceee7; border-radius:11px; background:#fff; padding:9px 13px; min-width:110px; color:#17403a; cursor:pointer; font-family:'Noto Naskh Arabic','Amiri',serif; font-size:25px; line-height:1.6; direction:rtl; }
.iqra-item:hover { border-color:#58bea5; background:#f2fbf6; }
.iqra-item.red { color:#b44735; }
.iqra-page-nav { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; }
@media (max-width:760px) { .quran-reader-layout{grid-template-columns:1fr}.quran-reader-sidebar{max-height:210px}.quran-reader-content{max-height:none}.quran-ayah-text{font-size:22px}.iqra-item{min-width:88px;font-size:22px}.iqra-book-tabs{grid-template-columns:repeat(3,minmax(0,1fr))} }
`;

function loadDone(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function saveDone(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Progress persistence is optional; reading remains available.
  }
}

function speakIqra(text: string) {
  let clean = text.replace(/[〇۝○]/g, ' ').trim();
  const transformation = clean.split(/=|->|➡/).map((part) => part.trim()).filter(Boolean);
  if (transformation.length > 1) clean = transformation[transformation.length - 1];
  const namedLetter = clean.split(':').map((part) => part.trim()).filter(Boolean);
  if (namedLetter.length > 1) clean = namedLetter[namedLetter.length - 1];
  void speakArabic(clean.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim());
}

export function IqraReader({
  onBack,
  initialJilid = 1,
  accountActive,
  onRequireAccount,
}: {
  onBack: () => void;
  initialJilid?: IqraJilid;
  accountActive: boolean;
  onRequireAccount: () => void;
}) {
  const [activeJilid, setActiveJilid] = useState<IqraJilid>(initialJilid);
  const [pageIndex, setPageIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>(() => loadDone(iqraProgressKey(initialJilid)));
  const pages = IQRA_BOOKS[activeJilid];
  const page = pages[pageIndex];
  const pageDone = completed.includes(page.id);

  function selectJilid(jilid: IqraJilid) {
    if (jilid > 1 && !accountActive) {
      onRequireAccount();
      return;
    }
    setActiveJilid(jilid);
    setPageIndex(0);
    setCompleted(loadDone(iqraProgressKey(jilid)));
  }

  function markPageDone() {
    if (pageDone) return;
    const next = [...completed, page.id];
    setCompleted(next);
    saveDone(iqraProgressKey(activeJilid), next);
  }

  function goPrevious() {
    if (pageIndex > 0) {
      setPageIndex((value) => value - 1);
      return;
    }
    if (activeJilid > 1) {
      const previousJilid = (activeJilid - 1) as IqraJilid;
      const previousPages = IQRA_BOOKS[previousJilid];
      setActiveJilid(previousJilid);
      setCompleted(loadDone(iqraProgressKey(previousJilid)));
      setPageIndex(previousPages.length - 1);
    }
  }

  function goNext() {
    if (pageIndex < pages.length - 1) {
      setPageIndex((value) => value + 1);
      return;
    }
    if (activeJilid < 6) {
      selectJilid((activeJilid + 1) as IqraJilid);
    }
  }

  return (
    <div className="quran-full-reader">
      <style>{READER_CSS}</style>
      <div className="quran-reader-toolbar">
        <div>
          <h3>Iqra' Jilid {activeJilid} Lengkap</h3>
          <p>{pages.length} halaman {IQRA_BOOK_DESCRIPTIONS[activeJilid].toLowerCase()}. Ketuk setiap bacaan untuk mendengar contoh.</p>
        </div>
        <span className="quran-reader-stat"><Check size={14} /> {completed.length}/{pages.length} halaman</span>
      </div>

      <div className="iqra-book-tabs" aria-label="Pilih jilid Iqra">
        {([1, 2, 3, 4, 5, 6] as IqraJilid[]).map((jilid) => {
          const locked = jilid > 1 && !accountActive;
          return (
            <button
              type="button"
              key={jilid}
              className={'iqra-book-tab' + (activeJilid === jilid ? ' active' : '') + (locked ? ' locked' : '')}
              onClick={() => selectJilid(jilid)}
              aria-label={locked ? `Iqra Jilid ${jilid}, masuk atau daftar gratis untuk membuka` : `Buka Iqra Jilid ${jilid}`}
            >
              {locked && <Lock size={13} />} Jilid {jilid}
            </button>
          );
        })}
      </div>

      {!accountActive && (
        <p className="iqra-book-access-note">
          Jilid 1 dapat dicoba sebagai tamu. Masuk atau daftar gratis untuk membuka seluruh 150 halaman Jilid 2-6 dan menyimpan progres belajar.
        </p>
      )}

      <div className="iqra-page-tabs" aria-label="Pilih halaman Iqra">
        {pages.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={'iqra-page-tab' + (index === pageIndex ? ' active' : '') + (completed.includes(item.id) ? ' done' : '')}
            onClick={() => setPageIndex(index)}
            aria-label={`Halaman ${item.pageNumber}`}
          >
            {item.pageNumber}
          </button>
        ))}
      </div>

      <section className="quran-reader-content iqra-book-page">
        <header className="iqra-page-heading">
          <span className="quran-reader-stat">Halaman {page.pageNumber}</span>
          <h3>{page.title}</h3>
          <p>{page.instruction}</p>
          {page.headerPreview && <div className="iqra-preview">{page.headerPreview.arabic}</div>}
        </header>
        <div className="iqra-rows">
          {page.rows.map((row, rowIndex) => (
            <div className="iqra-row" key={`${page.id}-row-${rowIndex}`}>
              {row.items.map((item, itemIndex) => (
                <button
                  type="button"
                  className={'iqra-item' + (item.isRed ? ' red' : '')}
                  key={`${page.id}-${rowIndex}-${itemIndex}`}
                  onClick={() => speakIqra(item.arabic)}
                  title="Dengarkan contoh"
                >
                  {item.arabic}
                </button>
              ))}
              {row.note && <small>{row.note}</small>}
            </div>
          ))}
        </div>
        <div className="iqra-page-nav">
          <button type="button" className="quran-audio-btn" onClick={goPrevious} disabled={activeJilid === 1 && pageIndex === 0}>
            <ChevronLeft size={15} /> Sebelumnya
          </button>
          <button type="button" className={'quran-audio-btn ' + (pageDone ? '' : 'primary')} onClick={markPageDone} disabled={pageDone}>
            <Check size={15} /> {pageDone ? 'Sudah dipelajari' : 'Tandai selesai'}
          </button>
          <button type="button" className="quran-audio-btn" onClick={goNext} disabled={activeJilid === 6 && pageIndex === pages.length - 1}>
            {pageIndex === pages.length - 1 && activeJilid < 6 ? `Lanjut Jilid ${activeJilid + 1}` : 'Berikutnya'} <ChevronRight size={15} />
          </button>
        </div>
      </section>
      <p className="quran-audio-note">Materi Iqra ini masih berstatus draft dan perlu ditinjau tim tahsin/tahfidz Bright Academy sebelum digunakan sebagai kurikulum resmi.</p>
      <button type="button" className="quran-audio-btn" onClick={onBack}><ChevronLeft size={15} /> Kembali ke jalur materi</button>
    </div>
  );
}

export function Juz30Reader({ onBack }: { onBack: () => void }) {
  const [dataset, setDataset] = useState<Record<string, QuranAyah[]> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(112);
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<string[]>(() => loadDone(JUZ30_PROGRESS_KEY));
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadJuz30()
      .then((data) => {
        if (!cancelled) setDataset(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Materi Juz 30 tidak dapat dimuat.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function stopAudio() {
    sequenceRef.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingKey(null);
  }

  useEffect(() => stopAudio, []);

  const filteredSurahs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('id');
    if (!normalized) return JUZ_30_SURAHS;
    return JUZ_30_SURAHS.filter((surah) =>
      `${surah.number} ${surah.nameLatin} ${surah.nameArabic} ${surah.meaning}`.toLocaleLowerCase('id').includes(normalized),
    );
  }, [query]);

  const selectedMeta = JUZ_30_SURAHS.find((surah) => surah.number === selectedNumber) ?? JUZ_30_SURAHS[0];
  const selectedAyahs = dataset?.[String(selectedMeta.number)] ?? [];

  function playAt(ayahs: QuranAyah[], index: number, sequenceId: number, continueSequence: boolean) {
    const ayah = ayahs[index];
    if (!ayah || sequenceRef.current !== sequenceId) {
      setPlayingKey(null);
      return;
    }
    const audio = new Audio(getAyahAudioUrl(ayah));
    audioRef.current = audio;
    setPlayingKey(`${ayah.surahNumber}:${ayah.ayahNumber}`);
    setAudioError('');
    audio.onended = () => {
      audioRef.current = null;
      if (continueSequence && index + 1 < ayahs.length && sequenceRef.current === sequenceId) {
        playAt(ayahs, index + 1, sequenceId, true);
      } else {
        setPlayingKey(null);
      }
    };
    audio.onerror = () => {
      audioRef.current = null;
      setPlayingKey(null);
      setAudioError('Audio qari tidak dapat dimuat. Periksa internet lalu coba lagi.');
    };
    audio.play().catch(() => {
      audioRef.current = null;
      setPlayingKey(null);
      setAudioError('Browser belum mengizinkan audio. Ketuk tombol dengarkan sekali lagi.');
    });
  }

  function playAyah(ayah: QuranAyah) {
    const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    stopAudio();
    const sequenceId = sequenceRef.current;
    playAt([ayah], 0, sequenceId, false);
  }

  function playWholeSurah() {
    if (!selectedAyahs.length) return;
    stopAudio();
    const sequenceId = sequenceRef.current;
    playAt(selectedAyahs, 0, sequenceId, true);
  }

  function chooseSurah(surah: Juz30SurahMeta) {
    stopAudio();
    setSelectedNumber(surah.number);
    setAudioError('');
  }

  function markSurahDone() {
    const id = String(selectedMeta.number);
    if (completed.includes(id)) return;
    const next = [...completed, id];
    setCompleted(next);
    saveDone(JUZ30_PROGRESS_KEY, next);
  }

  const isPlayingSurah = playingKey?.startsWith(`${selectedMeta.number}:`) ?? false;

  return (
    <div className="quran-full-reader">
      <style>{READER_CSS}</style>
      <div className="quran-reader-toolbar">
        <div>
          <h3>Mushaf Juz 30 Lengkap</h3>
          <p>37 surat, seluruh ayat, latin, arti Indonesia, dan contoh bacaan qari per ayat.</p>
        </div>
        <span className="quran-reader-stat"><BookOpen size={14} /> {completed.length}/37 surat dibaca</span>
      </div>

      <div className="quran-reader-layout">
        <aside className="quran-reader-sidebar">
          <label className="quran-reader-search">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama surat..." />
          </label>
          <div className="quran-surah-list">
            {filteredSurahs.map((surah) => (
              <button type="button" key={surah.number} className={'quran-surah-choice' + (surah.number === selectedMeta.number ? ' active' : '')} onClick={() => chooseSurah(surah)}>
                <span className="quran-surah-number">{surah.number}</span>
                <span><b>{surah.nameLatin}</b><small>{surah.meaning} · {surah.ayahCount} ayat</small></span>
                <span className="arabic">{surah.nameArabic}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="quran-reader-content">
          {!dataset && !loadError && <div className="quran-reader-empty"><span><LoaderCircle size={30} className="spin" /><br />Memuat ayat Juz 30...</span></div>}
          {loadError && <div className="quran-reader-empty">{loadError}</div>}
          {dataset && (
            <>
              <header className="quran-surah-heading">
                <div>
                  <h3>{selectedMeta.nameLatin} <span className="hijaiyah-arabic">{selectedMeta.nameArabic}</span></h3>
                  <p>{selectedMeta.meaning} · Surat ke-{selectedMeta.number} · {selectedAyahs.length} ayat</p>
                </div>
                <div className="quran-audio-actions">
                  <button type="button" className={'quran-audio-btn primary' + (isPlayingSurah ? ' playing' : '')} onClick={isPlayingSurah ? stopAudio : playWholeSurah}>
                    {isPlayingSurah ? <><CircleStop size={15} /> Hentikan</> : <><Headphones size={15} /> Putar surat</>}
                  </button>
                  <button type="button" className="quran-audio-btn" onClick={markSurahDone} disabled={completed.includes(String(selectedMeta.number))}>
                    <Check size={15} /> {completed.includes(String(selectedMeta.number)) ? 'Sudah dibaca' : 'Tandai selesai'}
                  </button>
                </div>
              </header>
              <p className="quran-audio-note">Audio menggunakan murattal Misyari Rasyid Al-Afasi dari sumber audio yang dipakai repository referensi. Koneksi internet diperlukan untuk memutar suara.</p>
              {audioError && <p className="quran-reader-error">{audioError}</p>}
              <div className="quran-ayah-list">
                {selectedAyahs.map((ayah) => {
                  const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
                  const playing = playingKey === key;
                  return (
                    <article className={'quran-ayah-row' + (playing ? ' playing' : '')} key={key}>
                      <div className="quran-ayah-top">
                        <span className="quran-ayah-index">{ayah.ayahNumber}</span>
                        <div className="quran-ayah-main">
                          <div className="quran-ayah-text">{ayah.arabicText}</div>
                          <div className="quran-ayah-latin">{ayah.transliteration}</div>
                          <div className="quran-ayah-meaning">{ayah.translationId}</div>
                        </div>
                        <button type="button" className={'quran-audio-btn quran-ayah-play' + (playing ? ' playing' : '')} onClick={() => playAyah(ayah)} title={playing ? 'Hentikan audio' : 'Dengarkan ayat'}>
                          {playing ? <Pause size={15} /> : <Volume2 size={15} />}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
      <button type="button" className="quran-audio-btn" onClick={() => { stopAudio(); onBack(); }}><ChevronLeft size={15} /> Kembali ke jalur materi</button>
    </div>
  );
}
