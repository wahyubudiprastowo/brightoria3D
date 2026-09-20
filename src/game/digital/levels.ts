export interface DigitalLevel {
  id: string;
  title: string;
  scenario: string;
  /** true = situasi aman / boleh dilakukan; false = mencurigakan / hindari. */
  isSafe: boolean;
  hint: string;
  explanation: string;
}

export const digitalLevels: DigitalLevel[] = [
  {
    id: 'd1',
    title: 'Pemain Asing di Game',
    scenario:
      'Di dalam permainan, seorang pemain yang belum pernah kamu temui memintamu menuliskan nomor HP di ruang chat.',
    isSafe: false,
    hint: 'Nomor HP adalah data pribadi. Orang baru di internet yang langsung meminta data pribadi perlu diwaspadai.',
    explanation:
      'Nomor HP adalah data pribadi. Tutup percakapan itu dan segera beri tahu Ayah atau Ibu — jangan pernah memberikannya ke orang asing.',
  },
  {
    id: 'd2',
    title: 'Pendaftaran Ditemani Orang Tua',
    scenario:
      'Ayah atau Ibu duduk di sampingmu dan membantumu mengetik kata sandi saat membuat akun aplikasi belajar.',
    isSafe: true,
    hint: 'Memiliki orang tua di samping saat membuat akun justru membantu menjaga kata sandi tetap rahasia dan aman.',
    explanation:
      'Membuat akun ditemani orang tua adalah cara yang aman. Kata sandi tetap rahasia untukmu dan Ayah/Ibu, tidak dibagikan ke orang lain.',
  },
  {
    id: 'd3',
    title: 'Hadiah Gratis yang Mencurigakan',
    scenario:
      'Kamu menerima pesan dari nomor yang tidak kamu kenal: "Klik tautan ini untuk mendapat hadiah gratis!"',
    isSafe: false,
    hint: 'Penipuan di internet sering memakai janji hadiah gratis untuk membuat orang mengklik tautan.',
    explanation:
      'Tautan dan hadiah gratis dari nomor tak dikenal biasanya jebakan. Jangan diklik — tunjukkan ke Ayah/Ibu dan hapus pesannya.',
  },
  {
    id: 'd4',
    title: 'Aplikasi Belajar Menanyakan Umur',
    scenario:
      'Aplikasi belajar yang biasa kamu pakai menanyakan umurmu sebelum membuka akun, agar tampilannya sesuai usiamu.',
    isSafe: true,
    hint: 'Aplikasi yang baik menyesuaikan tampilan dengan usia pengguna. Menanyakan umur adalah hal yang normal.',
    explanation:
      'Menanyakan umur membuat aplikasi bisa menampilkan materi yang sesuai usiamu. Ini pertanyaan yang wajar dari aplikasi yang sah.',
  },
  {
    id: 'd5',
    title: 'Teman Baru yang Minta Foto',
    scenario:
      'Seseorang yang baru saja kamu kenal lewat internet mengirim foto dan memintamu membalas dengan fotomu sendiri.',
    isSafe: false,
    hint: 'Foto pribadi tidak boleh dikirim ke orang yang baru dikenal, siapa pun itu di internet.',
    explanation:
      'Mengirim foto pribadi ke orang yang baru dikenal di internet berbahaya. Jangan kirim apa pun dan beri tahu orang tua.',
  },
];