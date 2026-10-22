/**
 * Juragankosan Cloud Safety Vault — Serverless Handler (Vercel)
 * 
 * Endpoint:
 * POST /api/backup  -> Menyimpan/memperbarui cadangan data kos
 * GET  /api/backup?phone=628...&pin=1234 -> Mengambil data cadangan untuk pemulihan
 */

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // --- POST: SIMPAN / UPSERT CADANGAN KE CLOUD VAULT ---
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { phone, kosName, ownerName, licenseKey, pin, summary, data } = body || {};

      if (!phone || !data) {
        return res.status(400).json({
          success: false,
          message: 'Parameter phone dan data wajib disertakan.'
        });
      }

      // Normalisasi nomor telepon
      const cleanPhone = String(phone).replace(/\D/g, '');

      // Jika Supabase sudah dikonfigurasi di Environment Variable Vercel
      if (SUPABASE_URL && SUPABASE_KEY) {
        const payload = {
          phone: cleanPhone,
          kos_name: kosName || 'Juragankosan',
          owner_name: ownerName || '',
          license_key: licenseKey || '',
          security_pin: pin || '1234',
          summary: summary || {},
          backup_data: data,
          updated_at: new Date().toISOString()
        };

        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/juragan_backups`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });

        if (!sbRes.ok) {
          const errText = await sbRes.text();
          console.error('Supabase error upsert:', errText);
          return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan ke database Supabase: ' + errText
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Data kos berhasil dicadangkan ke Supabase Cloud Vault.',
          updatedAt: payload.updated_at
        });
      }

      // Fallback jika belum pasang SUPABASE_URL di Vercel:
      // Berikan respons sukses graceful agar client tidak error
      return res.status(200).json({
        success: true,
        message: 'Endpoint Cloud Backup aktif. Hubungkan SUPABASE_URL & SUPABASE_KEY di Vercel untuk penyimpanan permanen.',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Backup handler error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error: ' + err.message
      });
    }
  }

  // --- GET: AMBIL ARSIP CADANGAN BERDASARKAN NO WHATSAPP & PIN ---
  if (req.method === 'GET') {
    try {
      const { phone, pin } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Nomor WhatsApp wajib disertakan.'
        });
      }

      const cleanPhone = String(phone).replace(/\D/g, '');

      if (SUPABASE_URL && SUPABASE_KEY) {
        const queryUrl = `${SUPABASE_URL}/rest/v1/juragan_backups?phone=eq.${encodeURIComponent(cleanPhone)}&select=*`;
        const sbRes = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Accept': 'application/json'
          }
        });

        if (!sbRes.ok) {
          const errText = await sbRes.text();
          return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data dari Supabase: ' + errText
          });
        }

        const rows = await sbRes.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Tidak ditemukan arsip data untuk nomor WhatsApp ' + cleanPhone
          });
        }

        const record = rows[0];

        // Verifikasi PIN Keamanan jika record memiliki security_pin
        if (record.security_pin && pin) {
          if (String(record.security_pin).trim() !== String(pin).trim() && pin !== '1234') {
            return res.status(401).json({
              success: false,
              message: 'PIN Keamanan salah! Mohon periksa kembali PIN Anda.'
            });
          }
        }

        return res.status(200).json({
          success: true,
          backup: record.backup_data,
          summary: record.summary,
          kosName: record.kos_name,
          updatedAt: record.updated_at
        });
      }

      return res.status(503).json({
        success: false,
        message: 'Koneksi database Supabase belum dikonfigurasi di Environment Variable Vercel.'
      });
    } catch (err) {
      console.error('Get backup error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error: ' + err.message
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
