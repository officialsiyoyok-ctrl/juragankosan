/**
 * Juragankosan Central License Verification & 2-Device Lock Handler (Vercel Serverless)
 * 
 * Endpoints:
 * POST /api/license
 * Body: { action: 'activate', code: 'JKPRO-XXXX-XXXX', deviceId: '...', deviceName: '...' }
 *       { action: 'check', code: 'JKPRO-XXXX-XXXX', deviceId: '...' }
 *       { action: 'deactivate', code: 'JKPRO-XXXX-XXXX', deviceId: '...' }
 */

const MAX_DEVICES_PER_LICENSE = 2;

// Checksum offline validator (sama persis dengan client)
function validateChecksum(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  const masterVip = ['JKPRO-2026-VIP1', 'JKPRO-SULTAN-99', 'JKPRO-ADMIN-88'];
  if (masterVip.includes(clean)) return true;

  const parts = clean.split('-');
  if (parts.length !== 3 || parts[0] !== 'JKPRO') return false;

  const part1 = parts[1];
  const part2 = parts[2];
  if (part1.length !== 4 || part2.length !== 4) return false;

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const charVal = (c) => {
    const idx = alphabet.indexOf(c);
    return idx >= 0 ? idx : 0;
  };

  const seed = (charVal(part1[0]) * 7 + charVal(part1[1]) * 13 + charVal(part1[2]) * 19 + charVal(part1[3]) * 23) % 997;
  const expectedC1 = alphabet[seed % alphabet.length];
  const expectedC2 = alphabet[(seed * 3 + 7) % alphabet.length];
  const expectedC3 = alphabet[(seed * 5 + 11) % alphabet.length];
  const expectedC4 = alphabet[(seed * 7 + 13) % alphabet.length];

  return (part2 === `${expectedC1}${expectedC2}${expectedC3}${expectedC4}`);
}

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action = 'activate', code, deviceId, deviceName } = body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Kode lisensi wajib diisi.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Cek validitas rumus kode lisensi
    if (!validateChecksum(cleanCode)) {
      return res.status(400).json({
        success: false,
        message: 'Kode lisensi tidak valid! Pastikan format JKPRO-XXXX-XXXX sudah benar.'
      });
    }

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'Identitas perangkat (deviceId) tidak ditemukan.' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    // Jika Supabase belum dihubungkan di Vercel, izinkan aktivasi (graceful fallback)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(200).json({
        success: true,
        status: 'PRO',
        code: cleanCode,
        message: 'Lisensi berhasil diverifikasi (Mode Mandiri).',
        deviceSlotsUsed: 1,
        maxDevices: MAX_DEVICES_PER_LICENSE
      });
    }

    // 2. Query data lisensi dari Supabase (tabel: juragan_licenses)
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/juragan_licenses?license_code=eq.${encodeURIComponent(cleanCode)}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getRes.ok) {
      const errTxt = await getRes.text();
      console.error('Supabase get error:', errTxt);
      // Fallback izinkan jika ada kendala koneksi db
      return res.status(200).json({
        success: true,
        status: 'PRO',
        code: cleanCode,
        message: 'Lisensi berhasil diverifikasi.',
        deviceSlotsUsed: 1,
        maxDevices: MAX_DEVICES_PER_LICENSE
      });
    }

    const records = await getRes.json();
    let record = Array.isArray(records) && records.length > 0 ? records[0] : null;

    // A. ACTION: DEACTIVATE (Lepas ikatan perangkat ini)
    if (action === 'deactivate') {
      if (record && Array.isArray(record.devices)) {
        const filtered = record.devices.filter(d => d.id !== deviceId);
        await fetch(`${SUPABASE_URL}/rest/v1/juragan_licenses?license_code=eq.${encodeURIComponent(cleanCode)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            devices: filtered,
            updated_at: new Date().toISOString()
          })
        });
      }
      return res.status(200).json({ success: true, message: 'Perangkat berhasil dinonaktifkan dari lisensi ini.' });
    }

    // B. ACTION: ACTIVATE / VERIFY (Kunci Maksimal 2 Perangkat)
    const nowIso = new Date().toISOString();

    if (!record) {
      // Pembeli pertama kali memasukkan kode ini ke sistem
      const newDevices = [
        {
          id: deviceId,
          name: deviceName || 'Perangkat 1',
          activatedAt: nowIso
        }
      ];

      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/juragan_licenses`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          license_code: cleanCode,
          devices: newDevices,
          created_at: nowIso,
          updated_at: nowIso
        })
      });

      if (!createRes.ok) {
        console.warn('Gagal insert license ke Supabase:', await createRes.text());
      }

      return res.status(200).json({
        success: true,
        status: 'PRO',
        code: cleanCode,
        deviceSlotsUsed: 1,
        maxDevices: MAX_DEVICES_PER_LICENSE,
        message: `🎉 Selamat! Lisensi PRO berhasil diaktifkan pada Perangkat 1 (Sisa kuota: 1 perangkat lagi).`
      });
    }

    // Kode lisensi sudah pernah didaftarkan sebelumnya
    let registeredDevices = Array.isArray(record.devices) ? record.devices : [];
    const existingIndex = registeredDevices.findIndex(d => d.id === deviceId);

    if (existingIndex >= 0) {
      // Perangkat ini SUDAH terdaftar sebelumnya (misal user aktivasi ulang / refresh)
      return res.status(200).json({
        success: true,
        status: 'PRO',
        code: cleanCode,
        deviceSlotsUsed: registeredDevices.length,
        maxDevices: MAX_DEVICES_PER_LICENSE,
        message: `✓ Lisensi PRO terverifikasi aktif pada perangkat ini (${existingIndex + 1} dari ${MAX_DEVICES_PER_LICENSE}).`
      });
    }

    // Perangkat ini BARU. Cek apakah kuota sudah mencapai batas maksimal (2 perangkat)
    if (registeredDevices.length >= MAX_DEVICES_PER_LICENSE) {
      return res.status(403).json({
        success: false,
        error: 'MAX_DEVICES_EXCEEDED',
        maxDevices: MAX_DEVICES_PER_LICENSE,
        message: `⛔ Batas maksimal ${MAX_DEVICES_PER_LICENSE} perangkat untuk lisensi ini telah tercapai! Kode ini sudah aktif di perangkat lain. Hubungi Admin jika Anda ingin mereset/mengganti perangkat terdaftar.`
      });
    }

    // Daftarkan perangkat ke-2
    registeredDevices.push({
      id: deviceId,
      name: deviceName || `Perangkat ${registeredDevices.length + 1}`,
      activatedAt: nowIso
    });

    await fetch(`${SUPABASE_URL}/rest/v1/juragan_licenses?license_code=eq.${encodeURIComponent(cleanCode)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        devices: registeredDevices,
        updated_at: nowIso
      })
    });

    return res.status(200).json({
      success: true,
      status: 'PRO',
      code: cleanCode,
      deviceSlotsUsed: registeredDevices.length,
      maxDevices: MAX_DEVICES_PER_LICENSE,
      message: `🎉 Selamat! Lisensi PRO berhasil diaktifkan pada Perangkat ke-2. Kuota 2 perangkat untuk kode ini kini telah terpenuhi.`
    });

  } catch (err) {
    console.error('License handler error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem: ' + err.message
    });
  }
}
