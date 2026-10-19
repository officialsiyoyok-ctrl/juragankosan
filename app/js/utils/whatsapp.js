/**
 * Juragankosan WhatsApp Integration Utilities
 */
import { cleanWhatsAppNumber, formatRupiah, formatDateIndo, formatMonthYear, calculateDaysDiffFromToday, terbilangRupiah } from './formatter.js?v=2.5';

export const DEFAULT_WA_TEMPLATE = `Halo Kak {nama} ({kamar}),

Semoga sehat selalu. Kami dari pengelola *{nama_kos}* ingin menginformasikan bahwa sewa kamar untuk periode *{periode}* sebesar *{nominal}* jatuh tempo pada *{jatuh_tempo}*{status_terlambat}.

Pembayaran dapat dilakukan melalui:
{rekening}

Jika Kakak sudah melakukan pembayaran, mohon konfirmasi dengan membalas pesan ini atau mengirimkan bukti transfernya ya.

Terima kasih banyak atas kerjasamanya! 🙏
_Salam hangat, {nama_pengelola} (Pengelola {nama_kos})_`;

export const DEFAULT_RECEIPT_WA_TEMPLATE = `*KWITANSI PEMBAYARAN SEWA - {nama_kos}*
----------------------------------------
No. Kwitansi : *{no_kwitansi}*
Status       : *LUNAS* ✅
Tanggal Bayar: {tgl_bayar}
Metode       : {metode_bayar}

Diterima Dari: *Kak {nama}*
Kamar        : *{kamar}*
Periode      : *{periode}*
Jumlah Sewa  : *{nominal}*
Terbilang    : _{terbilang}_

Terima kasih atas pembayarannya. Struk ini merupakan bukti pembayaran sewa yang sah.
----------------------------------------
_Pengelola {nama_kos} - {nama_pengelola}_`;

export const DEFAULT_RECEIPT_PARTIAL_WA_TEMPLATE = `*KWITANSI PEMBAYARAN CICILAN SEWA - {nama_kos}*
----------------------------------------
No. Kwitansi : *{no_kwitansi}*
Status       : *DICICIL (SEBAGIAN)* ⚡
Tanggal Bayar: {tgl_bayar}
Metode       : {metode_bayar}

Diterima Dari: *Kak {nama}*
Kamar        : *{kamar}*
Periode      : *{periode}*

• Cicilan Diterima : *{nominal_cicilan}*
• Total Terbayar   : *{terbayar}*
• Total Tagihan    : *{nominal}*
• *Sisa Tagihan*   : *{sisa_tagihan}*

Terbilang: _{terbilang}_

Pelunasan sisa tagihan dapat ditransfer melalui:
{rekening}

Terima kasih atas pembayarannya. Mohon melunasi sisa tagihan sesuai jadwal ya Kak. 🙏
----------------------------------------
_Pengelola {nama_kos} - {nama_pengelola}_`;

export const DEFAULT_RECEIPT_ADVANCE_WA_TEMPLATE = `*KWITANSI PEMBAYARAN SEWA MAJU - {nama_kos}*
----------------------------------------
No. Kwitansi : *{no_kwitansi}*
Status       : *LUNAS ({durasi_bulan} BULAN SEKALIGUS)* ✅
Tanggal Bayar: {tgl_bayar}
Metode       : {metode_bayar}

Diterima Dari: *Kak {nama}*
Kamar        : *{kamar}*
Periode Sewa : *{periode_mulai} s/d {periode_selesai}* ({durasi_bulan} Bulan)
Total Diterima: *{nominal}*
Terbilang    : _{terbilang}_

Terima kasih atas pembayaran di muka untuk {durasi_bulan} bulan ke depan. Struk ini merupakan bukti pembayaran sewa yang sah.
----------------------------------------
_Pengelola {nama_kos} - {nama_pengelola}_`;

export const DEFAULT_PARTIAL_REMINDER_WA_TEMPLATE = `Halo Kak {nama} ({kamar}),

Semoga sehat selalu. Kami dari pengelola *{nama_kos}* ingin menginformasikan sisa tagihan sewa kamar untuk periode *{periode}*:

• Total Sewa     : *{nominal}*
• Sudah Dicicil  : *{terbayar}*
• *Sisa Tagihan* : *{sisa_tagihan}*
• Batas Pelunasan: *{jatuh_tempo}*{status_terlambat}

Pembayaran dapat ditransfer melalui:
{rekening}

Jika Kakak sudah melakukan pembayaran sisa, mohon konfirmasi dengan membalas pesan ini ya.

Terima kasih atas kerjasamanya! 🙏
_Salam hangat, {nama_pengelola} (Pengelola {nama_kos})_`;

export function formatPaymentMethodsList(bankAccounts, acceptCash, cashNote, defaultOwner = '') {
  const lines = [];

  if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
    bankAccounts.forEach((acc) => {
      const bName = acc.bankName || 'Bank';
      const bNum = acc.accountNumber || '-';
      const bHolder = acc.accountHolder || defaultOwner;
      lines.push(`• *${bName}*: ${bNum}${bHolder ? ` (a.n ${bHolder})` : ''}`);
    });
  }

  if (acceptCash !== false) {
    const note = cashNote ? `: ${cashNote}` : '';
    lines.push(`• *💵 Tunai / Cash*${note}`);
  }

  return lines.length > 0 ? lines.join('\n') : '• Hubungi pengelola untuk detail pembayaran';
}

export function generateWhatsAppMessage(template, data) {
  let message = template || DEFAULT_WA_TEMPLATE;

  // Build bullet list of payment methods
  const accounts = data.bankAccounts && data.bankAccounts.length > 0
    ? data.bankAccounts
    : (data.bankName || data.bankAccount ? [{
        bankName: data.bankName || 'BCA',
        accountNumber: data.bankAccount || '',
        accountHolder: data.ownerName || ''
      }] : []);

  const paymentListText = formatPaymentMethodsList(
    accounts,
    data.acceptCash !== undefined ? data.acceptCash : true,
    data.cashNote,
    data.ownerName
  );

  // If old template contains the 3-line bank block, replace the whole block cleanly with the list
  const legacyBlock = `💳 *Bank*: {bank}\n🔢 *No. Rekening*: {rekening}\n👤 *Atas Nama*: {pemilik}`;
  if (message.includes(legacyBlock)) {
    message = message.replace(legacyBlock, paymentListText);
  }

  // Auto-upgrade legacy signatures if ownerName is present
  if (data.ownerName) {
    if (message.includes('_Salam hangat, Pengelola {nama_kos}_')) {
      message = message.replace('_Salam hangat, Pengelola {nama_kos}_', `_Salam hangat, ${data.ownerName} (Pengelola {nama_kos})_`);
    } else if (message.includes('_Pengelola {nama_kos}_') && !message.includes('{nama_pengelola}') && !message.includes(data.ownerName)) {
      message = message.replace('_Pengelola {nama_kos}_', `_Pengelola {nama_kos} - ${data.ownerName}_`);
    }
  }

  const bankSummary = accounts.length > 0 ? accounts.map((a) => a.bankName).join(', ') : (data.bankName || 'BCA');

  const replacements = {
    '{nama}': data.tenantName || 'Penyewa',
    '{kamar}': data.roomNumber || 'Kamar',
    '{nominal}': formatRupiah(data.amount || 0),
    '{nominal_cicilan}': formatRupiah(data.nominalCicilan || data.paidAmount || data.amount || 0),
    '{terbayar}': formatRupiah(data.paidAmount !== undefined ? data.paidAmount : (data.amount || 0)),
    '{sisa_tagihan}': formatRupiah(data.remainingAmount !== undefined ? data.remainingAmount : 0),
    '{durasi_bulan}': String(data.advanceMonths || data.durasiBulan || '1'),
    '{periode_mulai}': formatMonthYear(data.periodStart || data.period),
    '{periode_selesai}': formatMonthYear(data.periodEnd || data.period),
    '{periode}': formatMonthYear(data.period) || data.period || '-',
    '{jatuh_tempo}': formatDateIndo(data.dueDate) || '-',
    '{status_terlambat}': data.daysOverdue > 0 ? ` ⚠️ (Terlambat ${data.daysOverdue} hari)` : '',
    '{nama_kos}': data.kosName || 'Juragankosan',
    '{bank}': bankSummary,
    '{rekening}': paymentListText,
    '{daftar_rekening}': paymentListText,
    '{nama_pengelola}': data.ownerName || 'Pengelola Kos',
    '{pengelola}': data.ownerName || 'Pengelola Kos',
    '{pemilik}': data.ownerName || 'Pemilik Kos',
    '{kontak_pengelola}': data.ownerPhone || '',
    '{alamat_kos}': data.address || '',
    '{no_kwitansi}': data.receiptNumber || `KW-${Date.now().toString().slice(-6)}`,
    '{tgl_bayar}': formatDateIndo(data.paidDate) || formatDateIndo(new Date()),
    '{metode_bayar}': data.paymentMethod || 'Transfer Bank',
    '{terbilang}': data.terbilang || ''
  };

  for (const [key, val] of Object.entries(replacements)) {
    message = message.split(key).join(val);
  }

  return message;
}

/**
 * Generates synchronized, 100% accurate WhatsApp text for rent bill reminders
 */
export function generateBillWhatsAppText(bill, settings = {}) {
  if (!bill) return '';

  let activeSettings = settings && Object.keys(settings).length > 0 ? settings : null;
  if (!activeSettings && typeof window !== 'undefined' && window.juraganApp && window.juraganApp.store) {
    activeSettings = window.juraganApp.store.getSettings();
  }
  if (!activeSettings) activeSettings = {};

  let tenantName = bill.tenantName || '';
  let tenantPhone = bill.tenantPhone || '';
  let roomNumber = bill.roomNumber || '';

  // Fallback to store if available to ensure 100% synchronized live data
  if (typeof window !== 'undefined' && window.juraganApp) {
    const s = window.juraganApp.store || null;
    if (s) {
      if ((!roomNumber || roomNumber === 'Kamar') && bill.roomId) {
        const r = s.getRoomById(bill.roomId);
        if (r && r.number) roomNumber = r.number;
      }
      if ((!tenantName || tenantName === 'Penyewa') && bill.tenantId) {
        const t = s.getTenantById(bill.tenantId);
        if (t && t.name) {
          tenantName = t.name;
          tenantPhone = tenantPhone || t.phone;
        }
      }
    }
  }

  const daysOverdue = calculateDaysDiffFromToday(bill.dueDate);
  const templateToUse = bill.status === 'sebagian'
    ? DEFAULT_PARTIAL_REMINDER_WA_TEMPLATE
    : (activeSettings.waTemplate || DEFAULT_WA_TEMPLATE);

  return generateWhatsAppMessage(templateToUse, {
    tenantName: tenantName || 'Penyewa',
    tenantPhone: tenantPhone || '',
    roomNumber: roomNumber || 'Kamar',
    amount: bill.amount || 0,
    paidAmount: bill.paidAmount !== undefined ? bill.paidAmount : 0,
    remainingAmount: bill.remainingAmount !== undefined ? bill.remainingAmount : (bill.amount || 0),
    period: bill.period,
    dueDate: bill.dueDate,
    daysOverdue: Math.max(0, daysOverdue),
    kosName: activeSettings.kosName || 'Juragankosan',
    bankAccounts: activeSettings.bankAccounts,
    acceptCash: activeSettings.acceptCash,
    cashNote: activeSettings.cashNote,
    bankName: activeSettings.bankName,
    bankAccount: activeSettings.bankAccount,
    ownerName: activeSettings.ownerName,
    ownerPhone: activeSettings.ownerPhone,
    address: activeSettings.address
  });
}

/**
 * Generates synchronized, 100% accurate WhatsApp text for payment receipts (kwitansi)
 */
export function generateKwitansiWhatsAppText(bill, settings = {}, paymentDetails = {}) {
  if (!bill) return '';

  let activeSettings = settings && Object.keys(settings).length > 0 ? settings : null;
  if (!activeSettings && typeof window !== 'undefined' && window.juraganApp && window.juraganApp.store) {
    activeSettings = window.juraganApp.store.getSettings();
  }
  if (!activeSettings) activeSettings = {};

  let tenantName = bill.tenantName || '';
  let roomNumber = bill.roomNumber || '';

  // Fallback to store if available to guarantee real tenant name & room number
  if (typeof window !== 'undefined' && window.juraganApp) {
    const s = window.juraganApp.store || null;
    if (s) {
      if ((!roomNumber || roomNumber === 'Kamar') && bill.roomId) {
        const r = s.getRoomById(bill.roomId);
        if (r && r.number) roomNumber = r.number;
      }
      if ((!tenantName || tenantName === 'Penyewa') && bill.tenantId) {
        const t = s.getTenantById(bill.tenantId);
        if (t && t.name) tenantName = t.name;
      }
    }
  }

  const isAdvance = bill.isAdvance || (paymentDetails && paymentDetails.type === 'advance');
  const isPartial = bill.status === 'sebagian' || (paymentDetails && paymentDetails.type === 'partial');

  let templateToUse = DEFAULT_RECEIPT_WA_TEMPLATE;
  let receiptAmount = bill.amount;
  let paymentMethod = paymentDetails.paymentMethod || bill.paymentMethod || 'Transfer Bank';
  const paidDate = paymentDetails.paidDate || paymentDetails.date || bill.paidDate || new Date().toISOString().substring(0, 10);
  const receiptNumber = paymentDetails.receiptNumber || bill.receiptNumber || `KW/${(bill.period || '').replace('-', '')}/${(roomNumber || 'KMR').replace(/[^0-9a-zA-Z]/g, '').toUpperCase()}`;

  if (isAdvance) {
    templateToUse = DEFAULT_RECEIPT_ADVANCE_WA_TEMPLATE;
    const months = bill.advanceMonths || (paymentDetails ? (paymentDetails.monthsCount || paymentDetails.advanceMonths) : 1) || 1;
    receiptAmount = paymentDetails.totalAmount || bill.totalAdvanceAmount || (bill.amount * months);
  } else if (isPartial) {
    templateToUse = DEFAULT_RECEIPT_PARTIAL_WA_TEMPLATE;
    const latestPay = paymentDetails.amount || paymentDetails.payAmount
      || (bill.payments && bill.payments.length > 0 ? bill.payments[bill.payments.length - 1].amount : bill.paidAmount);
    receiptAmount = latestPay || bill.paidAmount || bill.amount;
    if (!paymentDetails.paymentMethod && bill.payments && bill.payments.length > 0) {
      paymentMethod = bill.payments[bill.payments.length - 1].paymentMethod || paymentMethod;
    }
  } else {
    templateToUse = DEFAULT_RECEIPT_WA_TEMPLATE;
    receiptAmount = bill.amount;
  }

  const terbilang = terbilangRupiah(receiptAmount);

  return generateWhatsAppMessage(templateToUse, {
    no_kwitansi: receiptNumber,
    tgl_bayar: formatDateIndo(paidDate),
    paidDate: paidDate,
    metode_bayar: paymentMethod,
    paymentMethod: paymentMethod,
    nama: tenantName || 'Penyewa',
    tenantName: tenantName || 'Penyewa',
    kamar: roomNumber || 'Kamar',
    roomNumber: roomNumber || 'Kamar',
    periode: formatMonthYear(bill.period),
    period: bill.period,
    nominal: bill.amount,
    amount: bill.amount,
    nominal_cicilan: receiptAmount,
    nominalCicilan: receiptAmount,
    paidAmount: bill.paidAmount !== undefined ? bill.paidAmount : bill.amount,
    terbayar: bill.paidAmount !== undefined ? bill.paidAmount : bill.amount,
    remainingAmount: bill.remainingAmount !== undefined ? bill.remainingAmount : 0,
    sisa_tagihan: bill.remainingAmount !== undefined ? bill.remainingAmount : 0,
    advanceMonths: bill.advanceMonths || (paymentDetails ? paymentDetails.monthsCount : 1),
    durasi_bulan: bill.advanceMonths || (paymentDetails ? paymentDetails.monthsCount : 1),
    periode_mulai: formatMonthYear(bill.period),
    periode_selesai: formatMonthYear(bill.periodEnd || bill.period),
    terbilang: terbilang,
    nama_kos: activeSettings.kosName || 'Juragankosan',
    kosName: activeSettings.kosName || 'Juragankosan',
    ownerName: activeSettings.ownerName,
    ownerPhone: activeSettings.ownerPhone,
    address: activeSettings.address,
    bankAccounts: activeSettings.bankAccounts,
    acceptCash: activeSettings.acceptCash,
    cashNote: activeSettings.cashNote,
    bankName: activeSettings.bankName,
    bankAccount: activeSettings.bankAccount
  });
}

export function openWhatsAppLink(phone, message) {
  const cleanPhone = cleanWhatsAppNumber(phone);
  if (!cleanPhone) {
    alert('Nomor WhatsApp penyewa tidak valid atau belum diisi!');
    return false;
  }
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(waUrl, '_blank');
  return true;
}

