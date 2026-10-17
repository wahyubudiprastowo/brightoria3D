## 2026-10-16 - Arena Hafalan Qur'an

- Menambahkan mini-game `Arena Hafalan Qur'an` ke Pulau Al-Qur'an dengan empat mode: Sambung Ayat, Susun Urutan Ayat, Tebak Nama Surat, serta Simak dan Pilih.
- Setiap mode memiliki lima ronde, skor, streak, ketepatan, umpan balik jawaban, hasil akhir, XP, dan rekor terbaik berbasis localStorage.
- Menggunakan teks surat pendek dari dataset Juz 30 existing serta audio murattal lokal untuk mode simak, tanpa dependency baru dan tanpa musik latar.
- Materi tetap draft dan perlu validasi tim tahsin/tahfidz Bright Academy sebelum rilis resmi.

## 2026-10-15 - Audio surat pendek dibuat lokal dan selalu tersedia

- Mengganti audio Taman Pixel yang bergantung pada Web Speech API dengan rekaman murattal qari asli.
- Menambahkan 30 file audio lokal untuk seluruh ayat Al-Asr, Al-Fil, Quraisy, Al-Kausar, Al-Ikhlas, Al-Falaq, dan An-Nas.
- Menambahkan tombol dengarkan per ayat dan tombol putar satu surat berurutan di panel Taman Pixel.
- Pembaca Juz 30 otomatis memakai audio lokal untuk tujuh surat tersebut dan tetap memakai sumber qari daring untuk surat lainnya.
- Tidak ada musik latar; audio hanya diputar setelah tindakan pengguna.

## 2026-10-15 - Iqra dan Mushaf Juz 30 lengkap dengan audio

- Mengganti detail contoh Iqra yang pendek menjadi pembaca Iqra' Jilid 1 lengkap 32 halaman berdasarkan data repository referensi.
- Menambahkan Mushaf Juz 30 lengkap: 37 surat dari An-Naba sampai An-Nas dengan seluruh ayat, transliterasi, dan arti Indonesia.
- Menambahkan audio murattal qari per ayat serta tombol putar satu surat berurutan; audio berhenti aman saat berpindah surat atau keluar dari pembaca.
- Menambahkan pencarian surat, penanda halaman/surat selesai, dan penyimpanan progres lokal yang terpisah dari evidence Hijaiyah.
- Audio membutuhkan internet. Materi dan pemetaan akses tetap draft sampai divalidasi tim tahsin/tahfidz Bright Academy.

## 2026-10-14 - Materi Qur'an Learning Adventure dibuat interaktif

- Mengubah kartu `Jalur Materi Qur'an`, `Mufrodat Qur'an`, dan `Materi Adab Qur'ani` dari overlay statis menjadi tombol yang bisa dibuka.
- Menambahkan halaman detail materi untuk tiap kartu, berisi lesson, contoh Arab, transliterasi, makna, catatan, dan latihan/praktik harian.
- Memperbaiki data materi Qur'an agar teks Arab tampil sebagai Unicode yang benar, bukan karakter rusak.
- Kartu premium sekarang tetap bisa dibuka sebagai preview materi, tanpa mengaktifkan payment/auth palsu.
- Semua materi baru tetap draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-14 - Integrasi Materi Qur'an Learning Adventure

- Mengambil bahan terkurasi dari repository `Qur-an-Learning-Adventure-Platform` dan memetakannya ke pulau Brightoria yang sesuai.
- Taman Al-Qur'an kini menampilkan jalur materi Iqra, Juz 30, tajwid dasar, dan lanjutan premium 30 juz/Iqra 2-6.
- Oasis Bahasa Arab kini menampilkan jalur `Mufrodat Qur'an`: free trial kosakata surat pendek dan premium kamus Qur'an lanjutan.
- Kampung Adab kini menampilkan materi `Adab Qur'ani`: praktik harian free trial dan hikmah surat/asbabun nuzul sebagai premium.
- Semua materi baru tetap berstatus draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-05 - Pembagian Materi Matematika per Game

- Membaca PDF rujukan `Matematika I` sampai `Matematika VI`; `Matematika IX` tidak dipakai untuk game SD karena materinya SMP.
- Memisahkan generator soal matematika menjadi profil `flight12` untuk Penerbangan Ilmu dan `frog34` untuk Lompat Katak.
- Penerbangan Ilmu kini fokus kelas 1-2: membilang, penjumlahan/pengurangan awal, nilai tempat dasar, pola, bentuk, pengukuran, pecahan setengah/seperempat, dan data sederhana.
- Lompat Katak kini fokus kelas 3-4: bilangan lebih besar, tambah-kurang, perkalian/pembagian, nilai tempat ribuan, pengukuran, pecahan dasar, pola, luas, dan data.
- Jembatan Numeria dikunci untuk kelas 5-6: KPK/FPB, pecahan senilai, desimal, rasio, persen, keliling/luas, sudut, data, kubus-balok, dan peluang dasar.
- Konten matematika tetap draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-05 - Oasis AI Sambung Surat Pendek

- Menambahkan mode `Level 2: Sambung Surat` ke mini-game `AI Angka Arab & Surat` di Pulau Oasis Bahasa Arab.
- Mode baru tetap memakai mekanik kamera tangan/cubit yang sama, tetapi materi berubah menjadi menyusun potongan surat pendek ke urutan target ayat.
- Menambahkan pemilih level di modal awal dan tab kecil saat game belum berjalan: `Level 1: Angka` dan `Level 2: Surat`.
- UI target, progress, hasil akhir, dan instruksi status dibuat adaptif berdasarkan mode aktif, termasuk jumlah target yang tidak selalu 10.
- Konten potongan surat pendek masih draft dan perlu validasi guru Qur'an/Bahasa Arab Bright Academy sebelum dipakai resmi.

## 2026-10-02 - Kampung Adab 3D visual polish

- Memperbesar dan merapatkan aset existing di `Adab Daily Life Simulator` agar warung, masjid, majelis ilmu, taman, rumah, NPC, pohon, dan props terasa lebih hadir.
- Mengubah simulator menjadi fullscreen `100vw/100vh` dengan Canvas penuh layar dan HUD ringkas di atas scene.
- Merapikan komposisi map: warung di kiri, masjid sebagai landmark belakang-tengah, majelis dekat pusat, taman kanan tengah, rumah kanan, dan karakter di foreground.
- Menambahkan plaza tengah, jalur tanah natural, cluster batu/rumput/bunga, pagar kayu, lampu taman, bangku, dan papan pusat memakai geometri ringan.
- Memperbaiki lighting menjadi lebih hangat dengan ambient/hemisphere/directional sunlight, shadow lebih lembut, serta tombol pencahayaan hangat/netral.
- Revisi lanjutan merenggangkan lokasi yang berdempetan, memperbesar terrain agar tepi map tidak terlalu terlihat, menurunkan kamera ke framing plaza, menambahkan bukit/awan latar, memberi offset label per area, dan mengganti judul HUD menjadi papan kayu seperti referensi.
- Mengganti latar procedural Kampung Adab dengan asset storybook lokal `kampung-adab-storybook-bg.png`, membuat Canvas transparan, dan mengurangi elemen backdrop 3D agar scene lebih bersih seperti mockup low-poly yang diberikan user.
- Konten adab dan staging visual tetap draft sampai divalidasi tim Bright Academy.

## 2026-10-02 - AI Angka Arab camera fallback

- Mengganti alur kamera `AI Angka Arab` agar tidak lagi memakai helper `camera_utils` saat meminta izin kamera, sehingga penolakan izin tidak memunculkan popup `alert()` native.
- Jika izin kamera ditolak, game sekarang menampilkan toast/status in-game dan tetap dapat dimainkan dengan mouse atau sentuhan.
- Kamera kembali menjadi mode utama: izin kamera diminta saat game dimulai, tombol kamera tetap tersedia untuk mencoba lagi jika browser belum memberi akses, dan mouse/touch hanya menjadi fallback cadangan.

## 2026-10-02 - Materi Hadits Anak untuk Kampung Adab

- Menambahkan modul `hadithLessons.ts` berisi 15 Hadits Hikmah anak yang disarikan dari PDF `200 Hadits pilihan untuk anak-anak`.
- Menghubungkan misi 3D Kampung Adab dengan hadits bertema salam, ilmu, masjid, menahan marah, dan jujur.
- Menampilkan kartu `Hadits Hikmah` di panel misi agar anak mendapat ringkasan nilai dan latihan harian sebelum memilih sikap.
- Semua ringkasan hadits tetap berstatus draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-02 - Numeria operasi hitung kelas 3-6

- Mengecek sumber materi matematika: pulau utama matematika adalah `Pulau Numeria`, sedangkan mode Latihan/SkyRun/Froggy memakai generator angka bersama.
- Mengubah 5 misi utama Numeria dari pecahan menjadi operasi hitung dasar: penjumlahan, pengurangan, dan perkalian ringan yang cocok untuk kelas 3-6.
- Mengganti generator angka bersama dari pecahan/persen menjadi operasi dasar: tambah, kurang, kali, bagi exact sederhana, dan operasi campuran ringan.
- Memperbarui label UI dan dokumentasi agar tidak lagi mengklaim Numeria sebagai game pecahan.
- Konten matematika tetap draft sampai divalidasi tim akademik Bright Academy.

## 2026-10-02 - Oasis Bahasa Arab AI Angka Arab

- Menambahkan mini-game baru `AI Angka Arab` di Pulau Oasis Bahasa Arab.
- Game memakai kamera dan MediaPipe Hands dari CDN untuk deteksi tangan: jari terbuka sebagai mode siap, cubit/genggam untuk memegang kartu, lalu lepas di target angka Arab.
- Materi awal mencakup angka ١ sampai ١٠ dengan kata Arab berharakat dan arti Indonesia/Melayu.
- Menambahkan fallback mouse/touch supaya tetap bisa dimainkan jika kamera belum aktif atau izin kamera ditolak.
- Menambahkan mode guru: durasi, kepekaan cubit, kecepatan kartu, skor benar, penalti salah, skeleton sensor, terjemahan, dan SFX.
- Menambahkan leaderboard Top 10 berbasis `localStorage`, toast feedback, partikel celebrasi, dan SFX pendek via Web Audio API. Tidak ada musik latar.
- Revisi lanjutan: mode AI Angka Arab dibuat full-screen dan koordinat kartu disamakan dengan koordinat sensor tangan/pointer agar kartu tepat berada di capit saat dipegang.
- Konten angka Arab masih draft dan perlu validasi guru Bahasa Arab Bright Academy sebelum dipakai resmi.

## 2026-09-25 - Benteng Amanah Digital

- Merombak materi Benteng Digital menjadi 10 kartu adab digital Islami.
- Tema baru mencakup amanah password, tabayyun berita, komentar baik, menjaga aib teman, izin orang tua, waktu berkah, chat orang asing, belanja digital dengan izin, grup tanpa ghibah, dan konten bermanfaat.
- Teks UI diganti menjadi `Benteng Amanah Digital` agar arah pulau terasa lebih islami.
- Visual gameplay dipoles menjadi misi menjaga benteng: ada gerbang/tower, badge prinsip adab digital, progress patroli, rule-card, dan tombol aksi tematik `Jaga Gerbang` / `Tahan Dulu`.
- Revisi visual lanjutan: menambahkan packet data animatif dan panel scanner prinsip agar misi menjaga benteng terasa lebih hidup tanpa asset/dependency baru.
- Mekanik, evidence key, XP, SFX pendek, dan kebijakan tanpa musik latar tetap dipertahankan.
- Konten materi masih draft dan perlu validasi tim akademik/literasi digital Bright Academy.

## 2026-09-25 - Kampung Adab Daily Life Simulator

- Menambahkan mode baru `Adab Daily Life Simulator` di Kampung Adab.
- Anak bisa masuk ke peta kampung kecil dan memilih lokasi rumah, sekolah, masjid, taman, atau warung amanah.
- Setiap lokasi punya skenario pilihan sikap dengan feedback benar/baik/perlu diperbaiki, sehingga gameplay Adab tidak hanya berupa cerita bercabang.
- Progress simulator disimpan di `localStorage` key `brightoria.adab.dailySimulator.v1` dan memberi XP ringan saat misi lokasi pertama kali selesai.
- Mode story lama, Buku Kisah, evidence/mastery, dan kebijakan tanpa musik latar tetap dipertahankan.
- Konten adab masih draft dan perlu validasi tim karakter/akademik Bright Academy sebelum rilis final.
- Revisi lanjutan: mode simulator diganti menjadi eksplorasi `Kampung Adab 3D Kindness Quest` yang memakai Canvas Three.js, kontrol jalan keyboard/tombol layar, deteksi dekat NPC/lokasi, dan tombol `Bantu`.
- Memasang 10 aset GLB lokal dari user untuk cottage, masjid, warung, sign/patung ilmu, serta NPC ibu/imam/teman/anak/wanderer.
- Materi misi diperluas menjadi mini quest adab yang lebih hidup: membantu orang tua, adab belajar, menjaga masjid, berbagi/berdamai di taman, dan amanah saat membeli.
- Fix kontrol 3D: layar simulator diperbesar, kamera bisa digeser dengan drag/wheel, tersedia tombol `Shift Lock`, keyboard WASD/arrow lebih stabil, dan tombol arah layar diganti joystick analog seperti mode Ekspedisi.
- Revisi materi: 5 misi Kampung Adab diganti menjadi situasi kampung yang lebih naratif dan variatif: menyambut tamu/tetangga, adab majelis ilmu, merapikan sandal masjid, mendamaikan teman di taman, dan amanah di warung.

## 2026-09-24 - Froggy water depth fix

- Memperbaiki bidang air Froggy yang sebelumnya terlalu tinggi dan terlalu opaque sehingga terlihat seperti dinding air menutup background oasis sampai area langit.
- Permukaan air diturunkan, opacity dikurangi, ukuran plane dirapikan, material dibuat lebih natural, dan `depthWrite` dimatikan agar background HD tetap terlihat menyatu.
- Gameplay, soal, XP, evidence, dan kebijakan tanpa musik tidak berubah.

## 2026-09-24 - Bri onboarding tour

- Menambahkan tutorial awal saat anak pertama kali membuka Brightoria.
- Bri menyapa dengan salam, menjelaskan bahwa ia akan memandu anak, dan memberi rekomendasi pulau pertama.
- Tur memiliki 3 langkah, tombol `Mulai Tur`, `Lewati`, `Nanti Saja`, serta opsi memilih Kampung Adab sebagai rekomendasi pertama.
- Aset karakter Bri dari PNG user diproses menjadi aset lokal transparan di `public/assets/onboarding/bri-guide.png`.
- Revisi aset: Bri onboarding diganti memakai PNG remove-bg terbaru dan di-upscale menjadi 690x690 agar lebih tajam saat tampil besar.
- Tutorial hanya muncul sekali dan menyimpan status di `localStorage`; tidak ada musik latar.

## 2026-09-23 - Taman Al-Qur'an pixel Juz 30

- Menambahkan mode baru `Taman Pixel Juz 30` di Taman Al-Qur'an.
- Anak bisa menjelajah peta pixel-style dengan keyboard atau tombol arah layar, mendekati papan taman, lalu membaca surat pendek.
- Mode awal berisi 7 pos surat: Al-Ikhlas, Al-Falaq, An-Nas, Al-Kawthar, Al-Asr, Quraisy, dan Al-Fil.
- Progress bacaan disimpan terpisah dari evidence Hijaiyah agar koleksi huruf lama tetap aman.
- Menambahkan TTS Arab untuk membaca surat dan SFX pendek saat membuka/menyelesaikan pos; tetap tanpa musik latar.
- Revisi visual: memasang aset pixel PNG user untuk rumah, platform rumput, tile air animatif, jembatan, pagar, papan kayu, pohon, semak, ayam, dan sapi agar peta tidak polos.
- Konten surat/latin masih draft dan perlu validasi akademik/tahsin Bright Academy sebelum rilis final.

## 2026-09-23 - Numeria visual refresh

- Arena Jembatan Numeria kini memakai background oasis/sungai dari aset PNG user sebagai layer belakang canvas 3D transparan.
- Papan jembatan mendapat tekstur visual dari aset papan kayu/biru yang dikirim user, menggantikan balok polos lama.
- Karakter penyeberang diganti ke model GLB `numeria-boxhead-backpacker.glb`.
- Pilar ujung jembatan diganti ke model GLB outpost/banner Numeria baru.
- Post-processing Numeria mempertahankan alpha canvas agar background HD tidak tertutup hitam.
- Gameplay, evidence/mastery, XP, dan kebijakan tanpa musik tidak berubah.

## 2026-09-23 - English Harbor platformer mode

- Menambahkan mode baru `Word Harbor Run` di English Harbor.
- Anak bisa menggerakkan karakter side-scroller dengan keyboard atau tombol layar untuk mencari kartu kata Inggris yang diminta.
- Hasil run memakai kontrak evidence English Harbor yang sudah ada, sehingga kata yang berhasil ditemukan tersimpan di peti dan memberi XP ringan.
- Revisi: runner kini memakai background, karakter, dan batu pijakan PNG dari aset user.
- Revisi materi: runner tidak lagi hanya mencari kata; setiap batu/kartu jawaban kini terhubung ke quiz random Bahasa Inggris seperti vocabulary, category, clue reading, dan simple sentence.
- Fix input quiz runner: jawaban hanya diproses saat karakter melompat dan mendarat dari atas platform jawaban; sentuhan samping atau overlap biasa tidak lagi memicu jawaban.
- Revisi lanjutan: mekanik landing-answer diganti total menjadi papan quiz. Ada 7 papan sepanjang jalur; anak membuka quiz di papan lalu menjawab pilihan ganda dengan tap/klik.
- Menambahkan aset papan kayu quiz, SFX benar/salah untuk pilihan jawaban, dan SFX lompat untuk kontrol runner.
- Fix runner quiz: saat papan quiz aktif, karakter dikunci di posisi papan dan physics ditahan agar kaki lebih napak serta tidak jatuh setelah jawaban benar.
- Tidak ada dependency baru dan tidak ada musik latar.

## 2026-09-22 - Froggy oasis arena

- Menambahkan aset GLB baru untuk game Lompat Katak: lily pad, lotus, cattail grove, dua variasi lantern oasis, dan lotus leaf sign.
- Arena Froggy kini memakai daun teratai GLB untuk platform, dekor oasis di sekitar kolam, air terjun animatif, percikan/tetes air kecil, dan kilau permukaan air.
- Menambahkan background HD oasis/desert untuk arena Froggy dari aset PNG referensi user, dipasang sebagai background layar di belakang canvas 3D transparan.
- Revisi visual: menambahkan paviliun oasis prosedural di atas air terjun, mengganti panel air terjun datar menjadi pita air animatif, mencerahkan air/fog, dan mendekatkan framing kamera agar dekor terlihat lebih HD.
- Revisi lanjutan: aset batu-air-terjun Meshy dipindahkan dari sisi kanan dan disatukan dengan waterfall animatif di sisi kiri, sehingga batu dan air terjun hidup berada pada fitur yang sama.
- Fix background: post-processing Froggy kini mempertahankan alpha canvas, sehingga background HD tidak lagi tertutup hitam setelah scene selesai load.
- Aset Meshy dioptimalkan dari total puluhan MB menjadi sekitar 1,51 MB runtime tambahan; fallback prosedural tetap ada jika model gagal dimuat.
- Gameplay, evidence, XP, dan kebijakan tanpa musik tidak berubah.

## 2026-09-22 - Ekspedisi camera lock

- Kontrol kamera bebas Ekspedisi dibuat lebih stabil: geser kiri-kanan tidak lagi mudah ikut menaik-turunkan kamera.
- Offset kamera third-person dirapikan supaya rotasi terasa lebih natural mengelilingi karakter.
- Menambahkan toggle `Kamera Lock` via tombol HUD atau tombol Shift; saat aktif, gerakan mouse langsung mengatur kamera seperti kontrol PC.
- Revisi: saat `Kamera Lock` aktif, arah karakter ikut terkunci ke arah kamera dan WASD bergerak relatif terhadap kamera; tombol `S` kembali langsung mundur tanpa membelok dulu.
- Klik kanan tetap bisa dipakai untuk drag kamera, scroll tetap untuk zoom, dan context menu browser tetap dicegah di arena.

## 2026-09-22 - Pasar Kata Arab

- Menambahkan mini-game `Pasar Kata Arab` di Oasis Bahasa Arab.
- Anak melayani pesanan pembeli: melihat/mendengar kata Arab, lalu memilih barang dengan arti yang sesuai.
- Jawaban benar menambah koleksi ransel dan XP ringan tanpa mengubah kontrak mastery utama Safari Kata.
- Tidak ada dependency baru, tidak ada musik latar, dan konten Arabic tetap perlu review akademik.

## 2026-09-21 ? Peta foreground adventure

- Model `Meshy_AI_Starbound_Wanderer_0921084739_texture.glb` dan `Meshy_AI_White_Cat_with_Red_Sc_0921091412_texture.glb` disalin ke source aset proyek.
- Runtime baru: `starbound-wanderer.glb` 298,9 KB dan `white-cat-red-scarf.glb` 191,4 KB setelah optimasi.
- `MapDecor.tsx` menambahkan vignette foreground kecil: platform batu/rumput prosedural, karakter petualang, dan kucing pendamping.
- PNG referensi yang dikirim dipakai sebagai arahan komposisi, tidak ditempel mentah ke peta karena berupa mockup/sheet gabungan.

## 2026-09-21 ? Awan 3D peta dunia

- Dua model awan Meshy disalin ke source aset dan dioptimalkan menjadi `cloud-soft-drifts.glb` 98,1 KB dan `cloud-white.glb` 93,0 KB.
- `MapDecor.tsx` kini memakai ring awan GLB 3D dengan beberapa layer rotasi/scale agar model Meshy yang cenderung gepeng terasa lebih bervolume.
- Awan prosedural lama tetap menjadi fallback Suspense/error boundary; peta 3D, OrbitControls, posisi cincin dunia, dan gameplay tidak berubah.
- Revisi: seluruh awan peta diganti ke model terbaru `cloud-pastel-drift.glb` 153,9 KB dari source 9,54 MB.
- Layer awan prosedural global dan siluet gunung segitiga di sekitar awan tidak lagi dirender.

## 2026-09-21 ? Kontrol Ekspedisi

- Karakter Ekspedisi kini langsung menghadap arah input WASD/joystick, termasuk saat menekan `S` untuk balik badan.
- Area canvas Ekspedisi mencegah context menu browser dan mendukung drag klik kanan/middle untuk menggeser sudut kamera kiri-kanan serta atas-bawah.
- Scroll wheel di arena Ekspedisi kini mengatur jarak kamera dengan batas aman.
- Tombol WASD/arrow/space tidak lagi ikut memicu scroll halaman saat arena aktif.

## 2026-09-21 ? Froggy model GLB baru

- Model `Meshy_AI_Low_Poly_Frog_0921033043_texture.glb` disalin ke `assets-source/models/meshy-froggy.glb`.
- Runtime `public/assets/models/froggy.glb` dioptimalkan menjadi 218,4 KB dari 10,41 MB.
- `FroggyGame.tsx` kini memakai model kodok GLB baru, dengan kodok prosedural lama sebagai fallback loading/error.
- Posisi model Froggy dinormalisasi dari bounding box supaya tidak tenggelam/menembus daun teratai.
- Kontrak gameplay, evidence/XP, Canvas boundary, dan kebijakan tanpa musik tidak berubah.
- Revisi: model kodok lompat diganti ke `Meshy_AI_Low_Poly_Frog_0921095558_texture.glb`; runtime `froggy.glb` kini 249,4 KB dari source 9,40 MB.
- Revisi lanjutan: pose lama dikembalikan untuk idle di daun sebagai `froggy.glb`, sedangkan model berdiri terbaru dipisah menjadi `froggy-jump.glb` dan hanya muncul saat fase lompat.

## 2026-09-20 ? Quran 2 dan pulau Arabic GLB

- `meshy-pulauquran2.glb` disalin ke sumber aset proyek dan dioptimalkan menjadi `pulau-quran.glb` 513,6 KB.
- Model Quran lama dipakai ulang sebagai `pulau-arabic.glb` 602,5 KB untuk Oasis Bahasa Arab.
- Peta 3D kini memakai GLB Quran/Arabic/Digital; game Arabic juga menampilkan preview model 3D.
- Total enam GLB runtime kini sekitar 2,57 MB; pipeline dan laporan optimasi diperbarui.

## 2026-09-20 ? Startup browser dan integrasi GLB

- Diagnosis: port 5173 ditempati proxy VS Code yang timeout; Vite default ke 5174.
- Enam GLB unik dioptimalkan dari 214,81 MB menjadi 2,57 MB; sumber asli dipertahankan.
- Integrasi Quran/Arabic/Digital pada peta dan game; menara Latihan; pesawat peta/SkyRun; Bri ringan.
- Boundary dan Suspense per model, boundary luar Canvas game/CharacterPicker;
  fallback menjaga kontrol DOM tersedia ketika WebGL gagal.
- Rotasi/zoom, posisi cincin, evidence/mastery/XP dan kebijakan tanpa musik dipertahankan.
- Validasi: typecheck/build, smoke browser, fallback model/WebGL, dan copy Android lulus.
- Seluruh materi AI tetap draft. Rincian dan pipeline: `docs/technical/GLB-ASSETS.md`.

# Changelog (ringkas — lihat docs/history/CHANGELOG-FULL.md untuk detail)

## 0.10.0 - Patch 10 — Rekonsiliasi Dokumentasi + Juice Kit

### Fixed
- **Regresi peta 3D diperbaiki**: `src/data/worlds.ts` dikembalikan ke
  formasi cincin Patch 06 (variasi Z -1.9..+1.9) setelah ditemukan
  tertimpa balik ke pola datar saat Patch 08.
- **Drift dokumentasi diperbaiki**: `AGENTS.md`/`GAMEPLAY-CATALOG.md`
  sebelumnya salah menyatakan hanya 2/6 dunia punya game — faktanya
  SEMUA 6 dunia sudah punya game sungguhan sejak Patch 07. Seluruh
  dokumen source-of-truth ditulis ulang agar sinkron dengan kode aktual.

### Added
- `src/game/juice.tsx` — juice kit bersama (Confetti, useStreak/
  StreakBadge, useCountUp, usePunch), murni dekoratif, tanpa dependency
  baru, tanpa musik latar.
- Juice kit dipasang di `QuizGame.tsx` (Quran/Adab/English), `NumeriaGame.tsx`,
  `DigitalGame.tsx`, `ArabicGame.tsx`.
- Rekomendasi pembersihan repo dicatat di `AGENTS.md` (folder duplikat
  `patches-maps`, file CSS addon lama, dokumen arsitektur ganda).

## Unreleased — Safari Kata Arab polish
- Safari Kata Arab kini tampil sebagai mini-game ekspedisi: intro misi, jalur
  jejak oasis, area peta mini, objek yang bisa dikumpulkan, ransel kata,
  feedback, dan summary misi.
- Kontrak evidence, mastery, aturan XP, SFX, dan guard sesi kosong tetap sama;
  tidak ada dependency baru atau musik latar.
  feedback visual, petunjuk berformat jelas, dan panel kata hari ini.
- Ringkasan misi menampilkan status penyelesaian dengan animasi ringan.

> Konten pembelajaran Arab tetap draft sampai disahkan tim akademik Bright
> Academy.

## 0.9.0 - Patch 09
### Added
- Game "Safari Kata Arab" di Oasis Bahasa Arab, memakai 72 kartu kosakata
  bergambar dari materi user dan sesi maksimal 8 kartu.
- Tulisan Arab berharakat, transliterasi, kategori, emoji visual, petunjuk,
  dan penjelasan singkat pada kartu kuis.
- Semua konten tetap berstatus draft sampai disahkan tim akademik Bright
  Academy.

## 0.8.0 - Patch 08
### Added
- Aset map lokal baru diintegrasikan ke `WorldScene.tsx`: background sky,
  connector route, dan waypoint marker.
- Peta tetap Three.js 3D interaktif dengan `OrbitControls`, klik dunia,
  dan fallback grid jika WebGL gagal.
- Warna tekstur lokal map/world disetel ke sRGB; tidak ada dependency baru
  atau `<Environment>` eksternal.

## 0.5.0 - Patch 05
### Fixed (koreksi arah dari Patch 04)
- Peta dunia DIKEMBALIKAN ke Three.js 3D interaktif (drag rotate, scroll
  zoom) — Patch 04 sempat menghapus interaksi ini demi "keandalan", yang
  ternyata dianggap user sebagai kemunduran ("tidak menarik", "gak bisa
  diputer-puter").
### Added
- Teknik "3D billboard": 6 ilustrasi pulau asli ditempel sebagai tekstur
  pada plane 3D yang selalu menghadap kamera (`<Billboard>` drei), sehingga
  visual premium DAN interaksi 3D bisa didapat sekaligus.
- `WorldSceneErrorBoundary` + `FallbackGrid` — jika WebGL gagal, otomatis
  fallback ke grid 2D, bukan blank.
- Efek glow (hover), ring (dipilih), shadow, dan awan melayang memakai
  aset asli yang disediakan user.
- `docs/gameplay/GAMEPLAY-CATALOG.md` ditulis ulang dengan peta kurikulum
  konkret per dunia (jenjang tajwid, tema adab, level bahasa, dst),
  ditandai jelas sebagai draft yang perlu validasi tim akademik.

## 0.4.0 - Patch 04
Perbaikan reliabilitas (AppErrorBoundary, styles.css file tunggal) — TETAP
DIPERTAHANKAN. Bagian peta DOM/CSS DIKOREKSI di Patch 05.

## 0.3.2 - Patch 03c
Badge "Game tersedia" vs "Segera hadir · mode demo"; dokumentasi master.

## 0.3.1 - Patch 03b
Hotfix: hapus `<Environment>` drei; ErrorBoundaryCanvas.

## 0.3.0 - Patch 03
Numeria Fraction Bridge — mini-game pertama.

## 0.2.0 - Patch 02 / 0.1.0 - Patch 01
Fondasi enam pulau 3D interaktif, landmark prosedural, dokumentasi agent.
