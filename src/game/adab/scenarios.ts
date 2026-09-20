/**
 * scenarios.ts — Konten cerita bercabang untuk Kampung Adab (Patch 26).
 *
 * STATUS KONTEN: DRAFT yang disusun AI berdasarkan nilai-nilai adab umum
 * yang diajarkan dalam pendidikan karakter anak (hormat orang tua, jujur,
 * tanggung jawab, adab pergaulan) — BUKAN kutipan dari kitab/kurikulum
 * resmi tertentu. WAJIB direview dan disahkan oleh tim akademik/karakter
 * Bright Academy sebelum dipakai siswa sungguhan secara luas, khususnya
 * untuk memastikan kesesuaian dengan nilai spesifik yang ingin diajarkan
 * sekolah (mis. dalil/hadits pendukung jika diperlukan).
 *
 * PRINSIP DESAIN (wajib dipertahankan jika menambah skenario baru):
 * 1. TIDAK ADA pilihan yang divonis "salah/gagal" — setiap pilihan tetap
 *    mendapat 1-3 bintang dan konsekuensi cerita yang masuk akal, bukan
 *    hukuman atau vonis kepribadian ("kamu anak nakal").
 * 2. Pilihan bernilai 3 bintang = tindakan adab terbaik yang jadi tujuan
 *    pembelajaran. 2 bintang = cukup baik tapi ada yang bisa ditingkatkan.
 *    1 bintang = kurang tepat, TAPI konsekuensinya tetap ditulis netral-
 *    reflektif, bukan menakutkan/menghakimi.
 * 3. Setiap skenario situasional konkret yang dialami anak sehari-hari,
 *    BUKAN pertanyaan hafalan teks.
 */

export type ChoiceQuality = 'best' | 'good' | 'needsWork';

export interface StoryChoice {
  id: string;
  text: string;
  quality: ChoiceQuality;
  consequence: string;
  reflection: string;
}

export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  icon: string;
  setting: string;
  choices: StoryChoice[];
}

export const chapters: StoryChapter[] = [
  {
    id: 'a1',
    chapterNumber: 1,
    title: 'Bangun Pagi',
    icon: '🌅',
    setting:
      'Matahari baru saja terbit. Kamu terbangun dan mendengar Ibu memanggil dari dapur untuk sarapan bersama.',
    choices: [
      {
        id: 'a1-c1',
        text: 'Bangun, rapikan tempat tidur, lalu menyapa Ibu dengan senyum',
        quality: 'best',
        consequence:
          'Ibu tersenyum senang melihatmu datang dengan wajah ceria. Sarapan pagi terasa lebih hangat karena kalian mengobrol sambil makan.',
        reflection: 'Menyapa dengan senyum dan merapikan tempat tidur sendiri adalah awal hari yang penuh adab.',
      },
      {
        id: 'a1-c2',
        text: 'Bangun dan langsung ke meja makan tanpa merapikan tempat tidur',
        quality: 'good',
        consequence:
          'Kamu sarapan bersama keluarga dengan baik. Nanti siang, kamu ingat untuk kembali merapikan tempat tidurmu sebelum berangkat sekolah.',
        reflection: 'Sarapan bersama keluarga itu baik — merapikan tempat tidur bisa jadi kebiasaan berikutnya yang kamu latih.',
      },
      {
        id: 'a1-c3',
        text: 'Menarik selimut lagi dan bilang "sebentar lagi, Bu"',
        quality: 'needsWork',
        consequence:
          'Ibu menunggu sedikit lebih lama. Saat akhirnya kamu bangun, sarapan sudah agak dingin, tapi Ibu tetap tersenyum menyambutmu.',
        reflection: 'Bangun lebih cepat saat dipanggil membuat waktu bersama keluarga jadi lebih menyenangkan.',
      },
    ],
  },
  {
    id: 'a2',
    chapterNumber: 2,
    title: 'Menolong Ibu',
    icon: '🧺',
    setting: 'Ibu terlihat sedang membawa banyak barang belanjaan sekaligus dari mobil ke rumah.',
    choices: [
      {
        id: 'a2-c1',
        text: 'Berlari membantu membawakan sebagian barang',
        quality: 'best',
        consequence: 'Ibu sangat senang dan berterima kasih. Pekerjaan jadi lebih ringan dan cepat selesai bersama-sama.',
        reflection: 'Membantu orang tua tanpa diminta adalah bentuk adab yang sangat dihargai.',
      },
      {
        id: 'a2-c2',
        text: 'Bertanya dulu, "Ibu perlu bantuan?" sebelum membantu',
        quality: 'good',
        consequence: 'Ibu menjawab "iya, tolong ya" sambil tersenyum. Kalian membawa barang bersama-sama ke dalam rumah.',
        reflection: 'Menawarkan bantuan dengan sopan juga merupakan sikap yang baik.',
      },
      {
        id: 'a2-c3',
        text: 'Tetap bermain karena sedang asyik, biarkan Ibu membawa sendiri',
        quality: 'needsWork',
        consequence:
          'Ibu membawa semua barang sendirian dengan agak kesulitan. Setelah selesai bermain, kamu melihat Ibu kelelahan dan merasa ingin membantu lain kali.',
        reflection: 'Menyadari saat orang tua butuh bantuan adalah langkah awal untuk lebih peka pada sekitar.',
      },
    ],
  },
  {
    id: 'a3',
    chapterNumber: 3,
    title: 'Giliran Berbicara',
    icon: '🙋',
    setting: 'Guru bertanya kepada seluruh kelas, dan beberapa teman mengangkat tangan bersamaan denganmu.',
    choices: [
      {
        id: 'a3-c1',
        text: 'Mengangkat tangan dan menunggu giliran dipanggil guru',
        quality: 'best',
        consequence: 'Guru memanggil namamu dan kamu menjawab dengan percaya diri. Teman-teman mendengarkan dengan tenang.',
        reflection: 'Menunggu giliran berbicara menunjukkan rasa hormat kepada guru dan teman sekelas.',
      },
      {
        id: 'a3-c2',
        text: 'Menjawab langsung tanpa menunggu ditunjuk',
        quality: 'good',
        consequence:
          'Jawabanmu benar, tapi guru mengingatkan dengan lembut untuk menunggu giliran lain kali. Kamu mengangguk paham.',
        reflection: 'Semangat menjawab itu bagus — menunggu giliran akan membuat kelas lebih tertib.',
      },
      {
        id: 'a3-c3',
        text: 'Berbicara dengan teman sebangku alih-alih memperhatikan',
        quality: 'needsWork',
        consequence: 'Kamu jadi tidak tahu jawaban yang benar. Teman sebangku mengingatkanmu untuk fokus ke depan.',
        reflection: 'Mendengarkan dengan saksama membantu kita belajar lebih banyak di kelas.',
      },
    ],
  },
  {
    id: 'a4',
    chapterNumber: 4,
    title: 'Uang yang Ditemukan',
    icon: '💰',
    setting: 'Di halaman sekolah, kamu menemukan selembar uang tergeletak di dekat tempat duduk.',
    choices: [
      {
        id: 'a4-c1',
        text: 'Mengambil dan menyerahkannya ke guru piket',
        quality: 'best',
        consequence:
          'Guru piket mengumumkan penemuan itu, dan seorang teman dari kelas lain datang dengan wajah lega karena uangnya kembali.',
        reflection: 'Kejujuran mengembalikan barang temuan membuat orang lain merasa lega dan dipercaya.',
      },
      {
        id: 'a4-c2',
        text: 'Bertanya ke teman-teman terdekat siapa yang kehilangan',
        quality: 'good',
        consequence: 'Tidak ada yang mengaku di sekitarmu, akhirnya kamu tetap menyerahkannya ke guru piket untuk diumumkan.',
        reflection: 'Berusaha mencari pemiliknya adalah niat baik — menyerahkan ke guru tetap langkah paling tepat.',
      },
      {
        id: 'a4-c3',
        text: 'Menyimpannya untuk jajan nanti',
        quality: 'needsWork',
        consequence:
          'Sepanjang hari kamu merasa tidak tenang memikirkan pemilik uang itu. Esok harinya kamu memutuskan menyerahkannya ke guru piket.',
        reflection: 'Barang yang bukan milik kita sebaiknya segera dikembalikan agar hati lebih tenang.',
      },
    ],
  },
  {
    id: 'a5',
    chapterNumber: 5,
    title: 'Waktu Makan',
    icon: '🍽️',
    setting: 'Keluarga berkumpul di meja makan untuk makan malam bersama.',
    choices: [
      {
        id: 'a5-c1',
        text: 'Membaca doa, makan dengan tenang, dan duduk sampai semua selesai',
        quality: 'best',
        consequence: 'Makan malam berlangsung hangat. Ayah bercerita tentang harinya, dan semua tertawa bersama.',
        reflection: 'Adab makan yang baik membuat waktu makan bersama keluarga terasa lebih bermakna.',
      },
      {
        id: 'a5-c2',
        text: 'Makan sambil sedikit terburu-buru karena ingin main lagi',
        quality: 'good',
        consequence: 'Kamu selesai duluan dan menunggu di ruang tamu. Ibu mengingatkan untuk menikmati waktu bersama keluarga.',
        reflection: 'Menikmati waktu makan bersama sama pentingnya dengan menyelesaikan makanan.',
      },
      {
        id: 'a5-c3',
        text: 'Bermain gawai sambil makan',
        quality: 'needsWork',
        consequence: 'Ayah mengingatkan untuk menyimpan gawai dulu. Kamu menyimpannya dan mulai mengobrol dengan keluarga.',
        reflection: 'Waktu makan adalah kesempatan baik untuk berbincang, bukan sambil sibuk dengan hal lain.',
      },
    ],
  },
  {
    id: 'a6',
    chapterNumber: 6,
    title: 'Mainan Kesukaan',
    icon: '🧸',
    setting: 'Temanmu ingin meminjam mainan robot kesayanganmu untuk dimainkan sebentar.',
    choices: [
      {
        id: 'a6-c1',
        text: 'Meminjamkan dengan senang hati dan bermain bersama',
        quality: 'best',
        consequence: 'Kalian bermain bersama dengan gembira. Temanmu berterima kasih dan mengembalikannya dengan hati-hati.',
        reflection: 'Berbagi dengan teman membuat pertemanan menjadi lebih hangat dan menyenangkan.',
      },
      {
        id: 'a6-c2',
        text: 'Meminjamkan tapi memintanya berhati-hati',
        quality: 'good',
        consequence: 'Temanmu setuju dan bermain dengan sangat hati-hati. Mainan kembali dalam kondisi baik.',
        reflection: 'Berbagi sambil menyampaikan harapan dengan sopan adalah cara yang baik.',
      },
      {
        id: 'a6-c3',
        text: 'Menolak karena takut mainannya rusak',
        quality: 'needsWork',
        consequence: 'Temanmu terlihat sedikit kecewa. Kalian akhirnya bermain permainan lain bersama.',
        reflection: 'Berbagi dengan teman kadang butuh keberanian — tidak apa jika ingin belajar pelan-pelan.',
      },
    ],
  },
  {
    id: 'a7',
    chapterNumber: 7,
    title: 'PR yang Belum Selesai',
    icon: '📝',
    setting: 'Malam sebelum sekolah, kamu ingat masih ada PR matematika yang belum dikerjakan.',
    choices: [
      {
        id: 'a7-c1',
        text: 'Segera mengerjakannya sebelum tidur, meski sedikit mengantuk',
        quality: 'best',
        consequence: 'PR selesai tepat waktu. Esoknya kamu bisa mengumpulkannya dengan tenang tanpa terburu-buru.',
        reflection: 'Menyelesaikan tanggung jawab meski terasa berat menunjukkan kedisiplinan yang baik.',
      },
      {
        id: 'a7-c2',
        text: 'Bangun lebih pagi besok untuk mengerjakannya',
        quality: 'good',
        consequence: 'Kamu bangun pagi dan berhasil menyelesaikan sebagian besar PR sebelum berangkat sekolah.',
        reflection: 'Mengatur waktu di pagi hari juga bisa jadi solusi, meski lebih baik dikerjakan lebih awal.',
      },
      {
        id: 'a7-c3',
        text: 'Memutuskan tidak mengerjakannya dan bilang lupa ke guru',
        quality: 'needsWork',
        consequence:
          'Guru mengingatkan pentingnya jujur dan bertanggung jawab. Kamu berjanji akan mengerjakan PR tepat waktu setelah ini.',
        reflection: 'Bertanggung jawab atas tugas sendiri membuat proses belajar menjadi lebih bermakna.',
      },
    ],
  },
  {
    id: 'a8',
    chapterNumber: 8,
    title: 'Berkunjung ke Rumah Teman',
    icon: '🚪',
    setting: 'Kamu diajak bermain ke rumah teman baru untuk pertama kalinya.',
    choices: [
      {
        id: 'a8-c1',
        text: 'Mengucapkan salam, melepas sepatu, dan berterima kasih saat pulang',
        quality: 'best',
        consequence: 'Orang tua temanmu sangat senang menyambutmu dan mengundangmu untuk bermain lagi lain waktu.',
        reflection: 'Adab bertamu yang baik membuat kunjungan terasa menyenangkan bagi semua orang.',
      },
      {
        id: 'a8-c2',
        text: 'Masuk dengan sopan tapi lupa mengucapkan terima kasih saat pulang',
        quality: 'good',
        consequence: 'Kunjunganmu berjalan menyenangkan. Di jalan pulang kamu ingat untuk berterima kasih lain kali.',
        reflection: 'Mengucapkan terima kasih adalah penutup yang baik untuk sebuah kunjungan.',
      },
      {
        id: 'a8-c3',
        text: 'Langsung berlari ke kamar teman tanpa menyapa orang tuanya',
        quality: 'needsWork',
        consequence: 'Orang tua temanmu tersenyum tipis. Temanmu mengingatkanmu untuk menyapa orang tuanya terlebih dahulu.',
        reflection: 'Menyapa tuan rumah terlebih dahulu adalah bagian penting dari adab bertamu.',
      },
    ],
  },
];
