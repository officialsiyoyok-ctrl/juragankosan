# ☁️ PANDUAN INTEGRASI SUPABASE CLOUD SAFETY VAULT (JURAGANKOSAN.ID)

Dokumen ini berisi panduan teknis langkah demi langkah untuk menghubungkan fitur **Brankas Cadangan Cloud di Balik Layar (Cloud Safety Vault)** ke database gratis **Supabase (PostgreSQL Cloud)**.

---

## 1. MENGAPA MENGGUNAKAN SUPABASE?

1. **Kapasitas Free Tier Melimpah (Rp 0 / Selamanya):**
   * Supabase memberikan gratis **500 MB database storage** dan **50.000 request aktif**.
   * Karena 1 arsip kosan rata-rata hanya berukuran **30 KB – 100 KB**, paket gratis ini sanggup menampung **5.000 s/d 10.000 pemilik kos aktif** tanpa biaya langganan bulanan sama sekali!
2. **Kecepatan & Kemudahan REST API:**
   * Endpoint serverless `/api/backup.js` di Vercel langsung terhubung ke REST API Supabase tanpa perlu konfigurasi server rumit.

---

## 2. LANGKAH 1: BUAT PROJECT SUPABASE GRATIS (2 MENIT)

1. Buka [supabase.com](https://supabase.com/) dan login/daftar menggunakan akun GitHub atau Email Anda.
2. Klik tombol **"New Project"**.
3. Isi informasi project:
   * **Name:** `juragankosan-cloud-vault`
   * **Database Password:** Buat password yang kuat (simpan di catatan aman).
   * **Region:** Pilih **Singapore (Southeast Asia)** agar akses dari Indonesia super cepat.
   * **Pricing Plan:** Pilih **Free ($0)**.
4. Klik **"Create new project"** dan tunggu sekitar 1-2 menit hingga database selesai dibuat.

---

## 3. LANGKAH 2: EKSEKUSI SQL SCHEMA (COPY-PASTE)

1. Di dashboard project Supabase Anda, buka menu **SQL Editor** (ikon terminal di sidebar kiri).
2. Klik **"New Query"**, lalu salin dan tempelkan script SQL berikut:

```sql
-- 1. Buat Tabel juragan_backups
CREATE TABLE IF NOT EXISTS public.juragan_backups (
    phone VARCHAR(30) PRIMARY KEY,
    kos_name VARCHAR(255) NOT NULL DEFAULT 'Juragankosan',
    owner_name VARCHAR(255) DEFAULT '',
    license_key VARCHAR(100) DEFAULT '',
    security_pin VARCHAR(20) DEFAULT '1234',
    summary JSONB DEFAULT '{}'::jsonb,
    backup_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat Index Pencarian Cepat berdasarkan No. Telepon
CREATE INDEX IF NOT EXISTS idx_juragan_backups_phone ON public.juragan_backups(phone);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.juragan_backups ENABLE ROW LEVEL SECURITY;

-- 4. Berikan Izin Akses CRUD untuk API Key (Anon / Service Role)
CREATE POLICY "Allow API access to backups" 
ON public.juragan_backups
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
```

3. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
4. Pastikan muncul notifikasi **"Success. No rows returned"**. Tabel siap digunakan!

---

## 4. LANGKAH 3: AMBIL API CREDENTIALS DI SUPABASE

1. Di project Supabase, buka menu **Project Settings** (ikon gerigi di pojok kiri bawah) ➔ pilih tab **API**.
2. Salin 2 nilai berikut:
   * **Project URL:** Contoh: `https://xyzcompany.supabase.co`
   * **Project API keys (anon / public):** String panjang `eyJhbGciOiJIUz...`

---

## 5. LANGKAH 4: PASANG DI VERCEL ENVIRONMENT VARIABLES

1. Buka dashboard Vercel Anda di [vercel.com](https://vercel.com/) dan pilih project **Juragan Kost**.
2. Buka tab **Settings** ➔ klik menu **Environment Variables** di sidebar kiri.
3. Tambahkan 2 variabel berikut:
   * **Key 1:** `SUPABASE_URL`  
     **Value:** Masukkan Project URL Supabase Anda (misal: `https://xyz.supabase.co`)
   * **Key 2:** `SUPABASE_ANON_KEY`  
     **Value:** Masukkan Anon Public Key Supabase Anda
4. Pastikan checkbox **Production**, **Preview**, dan **Development** dicentang.
5. Klik **"Save"**.
6. Lakukan **Redeploy** (atau *Git Push*) agar Vercel mengaktifkan variabel tersebut.

---

## 6. CARA KERJA & SKENARIO PENYELAMATAN KONSUMEN (SOP ADMIN)

### A. Alur Kerja Otomatis di HP Pengguna:
* Setiap kali pengguna mengisi No. WhatsApp Pengelola di menu **Pengaturan**, sistem menganggap nomor tersebut sebagai ID brankas pemilik.
* Setiap ada perubahan data (kamar, penyewa, atau pembayaran sewa), sistem dengan jeda *debounce* 4 detik otomatis mengirim snapshot data terbaru ke Cloud Vault secara hening (*silent* di background).

---

### B. SOP Penanganan Aduan Konsumen (Orang Tua / Gaptek):

#### Skenario 1: Pengguna Mengadu via WhatsApp
> **Pak Haji (Pengguna):**  
> *"Mas, saya baru ganti HP kemarin, kok pas saya buka Juragankosan data kos saya kosong ya? Bingung saya mas, tolong dibantu."*

**Langkah Anda (Admin):**
1. Buka Dashboard Supabase Anda ➔ masuk ke menu **Table Editor** ➔ pilih tabel `juragan_backups`.
2. Pada kolom pencarian, masukkan Nomor WhatsApp Pak Haji (misal: `081234567890` atau `6281234567890`).
3. Anda akan melihat record Pak Haji lengkap dengan kolom `backup_data`, `summary`, dan tanggal terakhir disimpan!
4. **Cara A (Sangat Mudah):** Minta Pak Haji buka HP barunya, masuk ke tab **Pusat Backup & Data**, klik tombol **"Pulihkan dari Cloud (via No. WA)"**, lalu ketik Nomor WA beliau dan PIN (standar: 1234). Data langsung kembali!
5. **Cara B (Bantuan File Langsung):** Jika Pak Haji sangat gaptek, Anda bisa copy isi JSON di kolom `backup_data`, simpan sebagai file `Juragankosan-Backup-PakHaji.json`, lalu kirimkan file tersebut via WhatsApp dengan panduan: *"Pak, tinggal klik tombol Pilih File JSON di aplikasi ya."*

---

Dengan sistem ini, aplikasi Anda memiliki **keunggulan kompetitif luar biasa**: tetap ringan dan cepat secara *local-first*, namun memiliki **jaring pengaman cloud kelas korporat** untuk memanjakan pelanggan senior!
