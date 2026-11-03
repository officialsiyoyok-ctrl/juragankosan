# PRODUCT KNOWLEDGE: JURAGAN KOSAN (JURAGANKOSAN)
*Panduan Lengkap Pengetahuan Produk, Target Pasar, Arsitektur Fitur, dan Angle Promosi (Pondasi Konteks AI Copywriter & Creator)*

---

## 1. IKHTISAR PRODUK (EXECUTIVE SUMMARY)

* **Nama Produk:** **Juragan Kosan** (disebut juga **Juragankosan** / **Juragan Kos PRO**)
* **Kategori Produk:** Aplikasi Web Manajemen Properti Kos, Kontrakan, dan Paviliun (PWA - *Progressive Web App*)
* **Tagline Resmi:** *"Kelola Kos & Kontrakan Lebih Rapi, Tagih Sewa 1-Klik Tanpa Sungkan, Tanpa Biaya Bulanan!"*
* **Situs Web / Domain:** `juragankosan.id`
* **Model Lisensi & Harga:**
  * **Sekali Bayar Seumur Hidup (Lifetime License - No Subscription Fee)**.
  * **Promo Peluncuran (Batch 1 - 50 Pembeli Pertama):** **Rp 149.000**
  * **Batch 2:** Rp 199.000
  * **Harga Normal:** Rp 299.000
  * **Ketentuan Kuota Lisensi:** 1 Kode Lisensi (`JKPRO-XXXX-XXXX`) aktif untuk **2 perangkat sekaligus** (misal: Laptop pemilik + HP pribadi, atau PC kantor + HP penjaga kos).
* **Platform Kompatibel:** Semua browser modern di Laptop (Windows/Mac/Chromebook), Tablet, dan Smartphone (Android & iOS). Tanpa perlu install aplikasi berat dari Play Store/App Store.
* **Arsitektur Teknis:** **100% Offline-First**. Data tersimpan aman di penyimpanan internal browser (*LocalStorage & IndexedDB*) milik pengguna sendiri. Tidak disimpan di server pihak ketiga, bebas risiko kebocoran data rahasia keuangan kos.

---

## 2. TARGET AUDIENCE (BUYER PERSONA)

### Persona 1: "Juragan Kos Tradisional" (Bapak/Ibu 40–60 Tahun)
* **Karakter:** Mengelola 5–30 pintu kos warisan atau hasil pensiun. Kurang akrab dengan teknologi rumit, biasa mencatat di buku tulis bergaris atau kalender dinding.
* **Pain Points:** 
  * Buku catatan sering terselip, kotor, atau robek.
  * Sering lupa siapa yang sudah bayar dan siapa yang menunggak karena tanggal masuk penyewa berbeda-beda.
  * Merasa tidak enak hati (*sungkan/canggung*) saat mau menagih ke anak kos.
* **Pemicu Pembelian:** Tampilan simpel bahasa Indonesia, tombol serba otomatis, dan teks tagihan WhatsApp yang sopan tanpa perlu mikir kalimat.

### Persona 2: "Pemilik Kos Karyawan / Pekerja Sibuk" (Usia 25–40 Tahun)
* **Karakter:** Menjadikan kos sebagai *side business / passive income*. Punya pekerjaan kantor utama dari pagi sampai sore.
* **Pain Points:**
  * Tidak punya waktu membalas chat satu per satu untuk menagih.
  * Pernah coba software lain tapi dipaksa bayar langganan bulanan mahal (Rp 50rb–Rp 200rb/bulan) yang memotong profit kos.
  * Ingin tahu kepastian laba bersih operasional secara cepat dari layar HP saat istirahat kerja.
* **Pemicu Pembelian:** Sekali bayar seumur hidup, tanpa biaya langganan, bisa dibuka cepat di laptop kantor maupun HP.

### Persona 3: "Pemilik Kontrakan Petakan / Paviliun Keluarga"
* **Karakter:** Menyewakan kontrakan petak 3–15 pintu ke keluarga kecil atau pekerja harian/bulanan.
* **Pain Points:**
  * Penyewa sering mencicil uang sewa (bayar sebagian).
  * Susah melacak sisa tunggakan cicilan secara akurat.
  * Butuh bukti bayar (kwitansi) cepat agar tidak ada sengketa di kemudian hari.
* **Pemicu Pembelian:** Fitur cicilan sewa terlacak otomatis dan kwitansi digital resmi berlogo sendiri langsung kirim via WhatsApp.

---

## 3. CORE PAIN POINTS & SOLUSI YANG DITAWARKAN

| Masalah yang Sering Dialami Pemilik Kos | Solusi Spesifik di Juragan Kosan |
| :--- | :--- |
| **Pusing pembukuan di buku/Excel** (rumus rusak, tidak bisa dibuka rapi di HP). | Antarmuka bersih, responsif, otomatis menghitung sisa kamar, total okupansi, pemasukan, dan tunggakan secara instan. |
| **Canggung / sungkan menagih sewa** ke penyewa yang mulai telat bayar. | **Fitur Tagih WhatsApp 1-Klik**: Menghasilkan pesan penagihan yang santun, profesional, lengkap rincian nomor rekening, tanpa simpan kontak ke buku telepon. |
| **Kwitansi kertas bon manual sering hilang** dan bikin boros beli buku kwitansi. | **Kwitansi Digital Otomatis**: Lengkap nomor urut resmi (`KW/202611/...`), stempel/watermark **LUNAS**, terbilang rupiah, dan bisa disematkan **Logo Kos Sendiri**. |
| **Penyewa bayar nyicil (sebagian) atau bayar maju 5 bulan sekaligus.** | Sistem mendukung **Cicilan Parsial** (sisa tunggakan terlacak) dan **Bayar Maju Multi-Bulan** (otomatis melunasi tagihan bulan-bulan ke depan). |
| **Laporan laba bersih sering jomplang/tekor** jika penyewa bayar sebelum jatuh tempo. | **Dual Accounting Basis Mode**: Pilihan mode *"Periode Sewa (Laba Rugi Akrual)"* untuk laba bulanan seimbang vs *"Tanggal Bayar (Kas Riil)"* untuk cek uang masuk rekening. |
| **Takut data keuangan diintip keluarga/teman** saat HP dipinjam. | **Fitur PIN Kunci Aplikasi (Security PIN)** 4 digit yang mengunci layar secara otomatis. |
| **Bosan bayar aplikasi langganan bulanan mahal.** | **Satu Kali Bayar untuk Selamanya**. Tanpa biaya per bulan, tanpa biaya per pintu, hemat jutaan rupiah per tahun. |

---

## 4. UNIQUE SELLING PROPOSITIONS (USP) — KEUNGGULAN UTAMA

1. **SEKALI BAYAR, MILIK SELAMANYA (ZERO SUBSCRIPTION FEE)**
   * Berbeda dengan SaaS manajemen kos lain (yang mengenakan biaya per bulan atau potongan komisi per pintu), Juragan Kosan menganut lisensi *Lifetime*. Beli sekali, gunakan tanpa batas waktu dan tanpa batas jumlah kamar/pintu.
2. **100% OFFLINE-FIRST & PRIVASI SANGAT AMAN**
   * Data tidak dilempar ke server asing atau cloud publik yang rawan diintip/bocor. Seluruh data kos, nama penyewa, dan nilai omzet tersimpan privat di perangkat pemilik.
3. **PENGINGAT TAGIHAN WA OTOMATIS TANPA SIMPAN NOMOR**
   * Pemilik kos tidak perlu menyimpan ribuan kontak anak kos di buku telepon HP. Cukup klik tombol *"Tagih WA"*, aplikasi langsung mengarahkan ke WhatsApp Web / WhatsApp Mobile dengan pesan yang sudah terformat rapi.
4. **BRANDING USAHA DENGAN LOGO KOS SENDIRI**
   * Pemilik bisa mengunggah logo usaha kos/kontrakan mereka sendiri. Logo otomatis muncul di Kop Kwitansi Resmi, Sidebar, Topbar, dan Layar Kunci.
5. **PUSAT KEUANGAN DENGAN METODE AKUNTANSI FLEKSIBEL**
   * Dilengkapi sakelar 1-klik untuk memilih metode pencatatan:
     * *Mode Periode Sewa (Laba Rugi)* $\rightarrow$ Bagi rata pendapatan sewa sesuai bulan hak huni (laba operasional stabil).
     * *Mode Tanggal Bayar (Kas Riil)* $\rightarrow$ Mengikuti fisik uang masuk rekening hari per hari.
6. **CADANGKAN & PULIHKAN DATA SANGAT MUDAH (JSON BACKUP)**
   * Data dapat di-export ke berkas file cadangan `.json` dalam 1 detik untuk dipindahkan antar perangkat (misal dari laptop ke HP, atau dicadangkan ke Google Drive/Flashdisk).

---

## 5. BEDAH DETAIL FITUR (FEATURE BREAKDOWN PER MODUL)

### Modul 1: Dashboard Ringkasan (Command Center)
* **Status Okupansi Kamar:** Menampilkan jumlah kamar terisi vs kamar kosong secara visual dengan persentase okupansi.
* **Kartu Ringkasan Finansial:** Total pemasukan bulan berjalan, estimasi potensi pendapatan penuh, dan total tagihan yang belum tertagih.
* **Tabel Tagihan Cepat Jatuh Tempo:** Menampilkan daftar penyewa yang jatuh tempo hari ini, besok, atau sudah terlambat.
* **Aksi Cepat:** Tombol cepat *"Tagih WA"* dan *"Tandai Lunas"* langsung dari dashboard tanpa harus masuk ke menu dalam.

### Modul 2: Data Kamar (Room Management)
* **Identitas Kamar Lengkap:** Nomor/nama kamar (misal: Kamar 101, Paviliun A, Petak 3), tipe kamar (VIP AC, Standar Non-AC, dll), posisi lantai.
* **Harga Sewa Fleksibel:** Pengaturan harga sewa per bulan. Jika harga kamar diedit, sistem secara cerdas menawarkan sinkronisasi otomatis ke tagihan berjalan yang belum lunas.
* **Daftar Fasilitas Kamar:** Tag fasilitas siap klik (AC, Kamar Mandi Dalam, Kasur Springbed, WiFi, Smart TV, Lemari, Meja Kerja, Token Listrik Sendiri, Kulkas, dll).
* **Status Kamar Real-time:** Badge penanda *"TERISI"* (lengkap dengan nama penghuni & tanggal masuk) atau *"KOSONG"*.
* **Catatan Khusus Kamar:** Tempat mencatat kondisi meteran listrik awal, nomor seri AC, atau catatan khusus kamar.

### Modul 3: Database Penyewa (Tenant Management)
* **Biodata Lengkap:** Nama penyewa, nomor WhatsApp aktif, foto KTP / nomor identitas (NIK), pekerjaan/kampus, alamat asal.
* **Kontak Darurat (Sangat Krusial untuk Pemilik Kos):** Nama kontak darurat, hubungan (Ayah, Ibu, Suami, Istri), dan nomor HP yang bisa dihubungi saat penyewa sakit atau terjadi keadaan darurat.
* **Parameter Sewa:** Penempatan kamar, tanggal mulai masuk (*check-in date*), tanggal jatuh tempo (tanggal 1–28 setiap bulan), dan uang jaminan (*deposit*).
* **Riwayat & Status Penyewa:** Status aktif vs sudah keluar (*check-out*).
* **Proses Check-out Rapi:** Alur pengembalian atau pemotongan uang deposit saat penyewa keluar.

### Modul 4: Tagihan & Sistem Penagihan Sewa (Billing & Rent)
* **Pembuatan Tagihan Otomatis:** Sistem otomatis men-generate tagihan setiap bulan berdasarkan tanggal jatuh tempo penyewa.
* **Status Tagihan Jelas:**
  * 🟢 **Lunas:** Lengkap dengan tanggal bayar, metode pembayaran, dan nomor kwitansi resmi.
  * 🟡 **Belum Bayar:** Tagihan menunggu pembayaran.
  * ⚡ **Hari Ini:** Menandakan hari ini adalah tanggal jatuh tempo.
  * 🔴 **Terlambat:** Menampilkan hitungan berapa hari penyewa menunggak (*contoh: Terlambat 4 hari*).
  * 🟠 **Dicicil (Sebagian):** Menampilkan nominal yang sudah dibayar dan sisa saldo yang masih harus dilunasi.
* **Dukungan Pembayaran Maju (Advance Payment):** Penyewa yang langsung melunasi 3, 6, atau 12 bulan sekaligus otomatis melunasi tagihan bulan-bulan berikutnya dalam satu nomor kwitansi paket.
* **Edit Manual Tagihan:** Fleksibilitas mengubah nominal tagihan per kamar jika ada penyesuaian khusus (diskon, denda, atau biaya tambahan).

### Modul 5: Tagih via WhatsApp 1-Klik (WhatsApp Smart Reminder)
* **Template Pesan Dinamis & Sopan:** Kalimat tagihan disusun secara elegan agar hubungan pemilik dan penyewa tetap harmonis tanpa rasa tersinggung.
* **Variabel Otomatis:**
  * `{nama}` $\rightarrow$ Nama panggilan penyewa.
  * `{kamar}` $\rightarrow$ Nomor kamar.
  * `{periode}` $\rightarrow$ Bulan sewa yang ditagihkan.
  * `{nominal}` $\rightarrow$ Jumlah rupiah yang harus ditransfer.
  * `{jatuh_tempo}` $\rightarrow$ Tanggal batas bayar.
  * `{rekening}` $\rightarrow$ Daftar nomor rekening bank/e-wallet pemilik kos.
  * `{status_terlambat}` $\rightarrow$ Keterangan otomatis jika sudah lewat tempo.
  * `{nama_kos}` & `{nama_pengelola}` $\rightarrow$ Identitas kos pemilik.
* **Tanpa Simpan Nomor:** Menggunakan protokol `wa.me/` langsung membuka chat WhatsApp penyewa secara instan.

### Modul 6: Kwitansi Digital Resmi & Cetak PDF
* **Standar Profesional:** Dilengkapi nomor kwitansi terstruktur (`KW/TAHUNBULAN/KAMAR-NOMOR`).
* **Watermark Cap LUNAS:** Tampilan stempel hijau resmi saat tagihan sudah lunas.
* **Terbilang Rupiah Otomatis:** Contoh: *"Satu Juta Lima Ratus Ribu Rupiah"*.
* **Personalisasi Logo:** Logo bisnis kos muncul di bagian atas kwitansi.
* **Siap Cetak / Bagikan:** Format ramah cetak printer thermal / A4 / Save to PDF, dan tombol salin ringkasan kwitansi teks untuk dikirim via WA.

### Modul 7: Pusat Keuangan, Arus Kas & Laba Bersih
* **Auto-Sync Pemasukan Sewa:** Semua tagihan yang ditandai lunas otomatis masuk ke pembukuan keuangan tanpa perlu catat dua kali.
* **Pencatatan Pemasukan Lain-Lain:** Denda keterlambatan, biaya parkir motor/mobil tambahan, penjualan token listrik, laundry, dll.
* **Pencatatan Biaya Operasional Kos:** Pengeluaran rutin terkategori (Listrik PLN, Air PDAM, WiFi Internet, Iuran Sampah/Kebersihan, Gaji Karyawan/Penjaga, Biaya Servis/Perbaikan AC/Pompa, Perlengkapan Kos, dll).
* **Dual Accounting Basis Mode (Inovasi Unggulan):**
  1. **Mode Periode Sewa (Standar Laba Rugi Akrual):** Menyelaraskan pendapatan sewa dengan bulan hak tinggal penyewa. Laba bersih bulanan menjadi stabil dan mencerminkan profit riil operasional.
  2. **Mode Tanggal Bayar (Kas Riil / Cash Basis):** Mencatat uang tepat saat dana masuk rekening bank/kantong pemilik.
* **Buku Kas Kronologis & Saldo Berjalan (Running Balance):** Riwayat mutasi debit, kredit, dan saldo akhir yang bisa difilter per Bulan Ini, Bulan Lalu, Tahun Ini Penuh, atau Rentang Tanggal Kustom.
* **Laporan Siap Cetak (Kop Resmi):** Cetak laporan laba bersih dan mutasi kas lengkap dengan kop nama kos untuk arsip atau laporan ke investor/pasangan.

### Modul 8: Kustomisasi & Keamanan
* **Manajemen Multi-Rekening:** Daftarkan berbagai rekening penerima (BCA, Mandiri, BRI, BNI, Jago, Dana, GoPay, OVO, dll) beserta opsi pembayaran tunai langsung.
* **Pengaturan Logo Usaha:** Upload logo kos (PNG/JPG), otomatis dikompresi di browser pemilik agar performa aplikasi tetap secepat kilat.
* **Kunci Keamanan PIN (App Lock):** Kunci aplikasi dengan PIN 4 digit saat ditinggal atau saat laptop/HP dipinjam orang lain.
* **Mode Tampilan:** Pilihan Mode Terang (*Light Mode*) dan Mode Gelap (*Dark Mode*) yang nyaman di mata.
* **Backup & Restore Data JSON:** Tombol satu kali klik untuk mengunduh semua data kos menjadi berkas backup, serta tombol pulihkan data saat berganti perangkat.

---

## 6. PRICING & PROMOTIONAL OFFERS (STRATEGI HARGA)

* **Harga Penetrasi (Batch 1 - 50 Pembeli Pertama):** **Rp 149.000** (Sekali Bayar Selamanya)
* **Harga Batch 2 (50 Pembeli Berikutnya):** **Rp 199.000**
* **Harga Normal (Setelah Promo Selesai):** **Rp 299.000**
* **Perbandingan Value (Cost vs Benefit):**
  * Biaya langganan aplikasi kos lain: $\text{Rp 75.000 / bulan} \times 12 = \textbf{Rp 900.000 per tahun}$.
  * Juragan Kosan: **Cukup bayar Rp 149.000 SEKALI SEUMUR HIDUP**. Hemat hingga ratusan persen sejak tahun pertama!

---

## 7. ANGLE PROMOSI SIAP PAKAI (MARKETING HOOKS & ANGLES)

Gunakan angle-angle di bawah ini saat meminta ChatGPT/Claude menyusun skrip video, narasi iklan, atau materi gambar:

### Angle 1: Emosional & Rasa Sungkan (The "Awkward Landlord" Hook)
* **Headline:** *"Mau nagih uang kos tapi ga enak hati? Juragan Kosan yang ngomong, Anda tinggal terima transferan!"*
* **Masalah:** Banyak pemilik kos stres bukan karena sepi, tapi karena sungkan menagih anak kos yang suka menghindar saat jatuh tempo.
* **Solusi:** 1 klik WhatsApp Reminder di Juragan Kosan menyusun kalimat penagihan yang sangat sopan, profesional, dan menyertakan rincian rekening tanpa bikin anak kos tersinggung.

### Angle 2: Anti-Langganan Bulanan (The "Stop Recurring Fees" Hook)
* **Headline:** *"Kelola puluhan pintu kos tanpa diperas biaya langganan bulanan!"*
* **Masalah:** Mengapa harus bayar sewa aplikasi tiap bulan hanya untuk mengelola kos milik sendiri?
* **Solusi:** Juragan Kosan cukup dibeli sekali (Rp 149rb), aktif selamanya, tanpa biaya per pintu, tanpa potongan komisi, bebas biaya seumur hidup.

### Angle 3: Kerapian & Anti-Tombok (The "Buku Kas Berantakan" Hook)
* **Headline:** *"Uang sewa kos ratusan juta setahun, tapi pencatatannya masih di buku warung yang rawan hilang?"*
* **Masalah:** Catatan manual bikin pemilik kos tidak sadar ada penyewa yang sudah nunggak 3 bulan, atau uang sewa habis terpakai untuk belanja harian tanpa kontrol laba bersih.
* **Solusi:** Dashboard Juragan Kosan menampilkan status kamar, riwayat lunas, dan laba bersih otomatis secara real-time.

### Angle 4: Privasi & Keamanan Data (The "Zero Server Breach" Hook)
* **Headline:** *"Data omzet dan nomor telepon penyewa kos Anda rahasia? Simpan di perangkat sendiri, bukan di server orang lain."*
* **Masalah:** Aplikasi online berbasis cloud rentan kebocoran data pribadi atau down saat server bermasalah.
* **Solusi:** Juragan Kosan berbasis *Offline-First*. Data Anda 100% milik Anda di perangkat Anda sendiri.

---

## 8. TEMPLATE PROMPT UNTUK CHATGPT & CLAUDE

Berikut adalah formula prompt siap pakai yang bisa langsung disalin ke ChatGPT / Claude bersama dokumen ini:

### A. Prompt Pembuatan Script Video Pendek (TikTok / Instagram Reels / YouTube Shorts - 30-45 Detik)
```text
Bertindaklah sebagai Scriptwriter Video Iklan Direct Response handal.
Pelajari dokumen Product Knowledge "Juragan Kosan" di atas.
Buatkan saya 3 konsep script video vertikal (durasi 30-45 detik) dengan formula:
1. HOOK (Detik 0-5): Masalah visual yang menyentak pemilik kos (misal: pusing cari bon kwitansi, atau canggung mau tagih sewa di WA).
2. PROBLEM AGITATION (Detik 6-15): Gambarkan betapa melelahkannya cara lama (buku kas basah/hilang, penyewa nunggak lama).
3. SOLUTION & DEMO (Detik 16-30): Tunjukkan solusi aplikasi Juragan Kosan (tombol Tagih WA 1-klik, kwitansi logo sendiri, laba bersih otomatis).
4. OFFER & CTA (Detik 31-45): Penawaran promo Batch 1 cuma Rp 149.000 sekali bayar tanpa langganan bulanan. Ajak klik link di bio / chat WA.
Sertakan panduan visual kamera, teks di layar (on-screen text), dan intonasi voiceover bahasa Indonesia yang santai tapi meyakinkan.
```

### B. Prompt Pembuatan Copywriting Iklan Meta Ads (Facebook & Instagram Feed/Carousel)
```text
Gunakan dokumen Product Knowledge "Juragan Kosan". 
Tuliskan 3 variasi Copywriting Iklan Meta Ads (Facebook/Instagram) dengan angle berbeda:
- Variasi 1: Angle Solutif (Fokus pada fitur Tagih WA 1-Klik dan Kwitansi Digital Resmi).
- Variasi 2: Angle Finansial / Value (Fokus pada Sekali Bayar Seumur Hidup Rp 149rb vs Aplikasi Langganan Bulanan).
- Variasi 3: Angle Storytelling Pemilik Kos (Kisah juragan kos yang dulu repot mencatat manual di buku, sekarang santai pantau lewat HP).
Format copy harus mencakup: Headline pemikat, Body copy terstruktur dengan bullet points emoji, Social proof/urgency promo Batch 1, dan Call To Action (CTA) yang kuat.
```

### C. Prompt Pembuatan Ide Prompt Gambar / Visual AI (Midjourney / Canva / FLUX)
```text
Berdasarkan Product Knowledge "Juragan Kosan", buatkan 5 ide konsep visual gambar iklan untuk Instagram Feed (1:1) dan Story (9:16).
Untuk setiap ide, berikan:
1. Konsep Visual Utama (misal: Split-screen "Cara Lama Buku Kusut vs Cara Baru Juragan Kosan di Layar HP Modern").
2. Headline teks utama yang ditempel di gambar.
3. Prompt bahasa Inggris untuk image generator (Midjourney/FLUX) agar menghasilkan foto realistis pemilik kos Indonesia yang tersenyum lega memegang smartphone.
```

### D. Prompt Handling Objections (Jawaban Tanya Jawab Chat WhatsApp CS / Penjualan)
```text
Berdasarkan dokumen Product Knowledge "Juragan Kosan", buatkan panduan tanya jawab (FAQ & Objection Handling) untuk admin WhatsApp saat calon pembeli bertanya:
1. "Apakah aplikasi ini harus bayar langganan bulanan?"
2. "Data kos saya aman nggak? Apakah bisa dilihat oleh orang lain?"
3. "Kalau saya gaptek dan cuma punya HP Android, apakah bisa pakai?"
4. "Gimana kalau ganti HP atau laptop, apakah datanya hilang?"
5. "Bisa untuk kontrakan petakan atau kos putri yang bayarnya beda-beda tanggal nggak?"
Buat jawabannya ramah, meyakinkan, dalam bahasa Indonesia yang santun dan profesional.
```

---
*Dokumen ini disusun resmi untuk standarisasi materi promosi, periklanan, dan edukasi Juragan Kosan.*
