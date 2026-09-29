export interface DigitalLevel {
  id: string;
  title: string;
  scenario: string;
  /** true = sikap aman/baik; false = perlu dihindari atau minta bantuan. */
  isSafe: boolean;
  hint: string;
  explanation: string;
}

export const digitalLevels: DigitalLevel[] = [
  {
    id: 'amanah-password',
    title: 'Gerbang Amanah Password',
    scenario:
      'Teman satu kelas meminta password akun belajarmu karena katanya hanya ingin melihat tugas sebentar.',
    isSafe: false,
    hint: 'Password adalah amanah. Bahkan teman baik pun tidak perlu tahu password pribadi.',
    explanation:
      'Password harus dijaga seperti amanah. Tolak dengan sopan, lalu tawarkan bantuan tanpa membagikan akunmu.',
  },
  {
    id: 'tabayyun-news',
    title: 'Menara Tabayyun',
    scenario:
      'Di grup kelas ada pesan: "Besok libur mendadak! Sebarkan cepat!" tetapi tidak ada info dari guru atau sekolah.',
    isSafe: false,
    hint: 'Tabayyun artinya mengecek dulu sebelum percaya atau menyebarkan kabar.',
    explanation:
      'Jangan langsung menyebarkan kabar yang belum jelas. Cek ke guru/orang tua dulu agar tidak ikut menyebarkan info keliru.',
  },
  {
    id: 'kind-comment',
    title: 'Perisai Komentar Baik',
    scenario:
      'Kamu ingin memberi komentar di video teman: "MasyaAllah, gambarnya rapi. Semangat terus ya!"',
    isSafe: true,
    hint: 'Komentar yang baik membuat hati teman lebih kuat dan tidak menyakiti.',
    explanation:
      'Ini komentar yang baik. Di dunia digital pun kita tetap menjaga lisan: berkata baik atau diam.',
  },
  {
    id: 'aib-photo',
    title: 'Benteng Menjaga Aib',
    scenario:
      'Kamu punya foto teman yang jatuh lucu. Teman lain menyuruhmu mengirimnya ke grup agar semua tertawa.',
    isSafe: false,
    hint: 'Foto memalukan bisa menyakiti hati dan termasuk membuka aib teman.',
    explanation:
      'Jangan sebarkan foto yang membuat teman malu. Menjaga kehormatan teman adalah bagian dari akhlak baik.',
  },
  {
    id: 'parent-permission',
    title: 'Izin Orang Tua',
    scenario:
      'Aplikasi baru meminta izin kamera dan lokasi. Kamu belum tahu aplikasi itu untuk apa.',
    isSafe: false,
    hint: 'Kalau aplikasi meminta data penting, anak perlu bertanya kepada orang tua dulu.',
    explanation:
      'Minta izin Ayah/Ibu sebelum memberi akses kamera, lokasi, kontak, atau foto. Itu cara menjaga diri dan keluarga.',
  },
  {
    id: 'study-time',
    title: 'Waktu Berkah',
    scenario:
      'Waktu mengaji akan mulai 10 menit lagi. Kamu menutup game, merapikan HP, lalu bersiap.',
    isSafe: true,
    hint: 'Mengatur waktu digital membantu ibadah, belajar, dan istirahat tetap terjaga.',
    explanation:
      'Bagus. HP boleh dipakai untuk hal bermanfaat, tapi waktu ibadah, belajar, dan istirahat tetap perlu dijaga.',
  },
  {
    id: 'unknown-chat',
    title: 'Chat Orang Asing',
    scenario:
      'Orang yang tidak kamu kenal mengirim pesan pribadi dan bertanya nama lengkap, sekolah, dan alamat rumahmu.',
    isSafe: false,
    hint: 'Nama lengkap, sekolah, alamat, nomor HP, dan foto pribadi termasuk data yang harus dijaga.',
    explanation:
      'Jangan jawab. Tutup chat dan beri tahu orang tua. Menjaga data pribadi adalah ikhtiar menjaga keselamatan.',
  },
  {
    id: 'ask-before-buy',
    title: 'Belanja dengan Amanah',
    scenario:
      'Game menawarkan item keren berbayar. Kamu ingin bertanya dulu kepada orang tua sebelum menekan beli.',
    isSafe: true,
    hint: 'Pembelian digital harus seizin orang tua agar tidak memakai uang tanpa amanah.',
    explanation:
      'Ini pilihan amanah. Bertanya dulu sebelum membeli item digital menunjukkan kamu bisa dipercaya.',
  },
  {
    id: 'group-gossip',
    title: 'Grup Tanpa Ghibah',
    scenario:
      'Di grup chat, beberapa teman mulai mengejek teman yang tidak sedang online. Kamu ikut menambahkan ejekan.',
    isSafe: false,
    hint: 'Mengejek orang di grup tetap menyakiti, walaupun orangnya tidak membaca saat itu juga.',
    explanation:
      'Hindari ejekan dan ghibah digital. Kamu bisa mengubah arah obrolan atau mengingatkan dengan lembut.',
  },
  {
    id: 'good-content',
    title: 'Konten Bermanfaat',
    scenario:
      'Kamu memakai tablet untuk menonton video belajar tajwid singkat bersama orang tua.',
    isSafe: true,
    hint: 'Teknologi bisa menjadi jalan kebaikan jika dipakai untuk ilmu dan ditemani orang dewasa.',
    explanation:
      'MasyaAllah, ini contoh penggunaan digital yang bermanfaat. Teknologi dipakai untuk menambah ilmu dan kebaikan.',
  },
];
