/**
 * Juragankosan Formatter & Utility Functions
 */

export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function parseRupiahInput(value) {
  if (typeof value === 'number') return Math.max(0, Math.floor(value));
  const cleaned = String(value).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_NAMES_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function normalizeDateString(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmMatch) {
    const d = dmMatch[1].padStart(2, '0');
    const m = dmMatch[2].padStart(2, '0');
    const y = dmMatch[3];
    return `${y}-${m}-${d}`;
  }
  // Fallback Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

export function normalizeYearMonth(val) {
  if (!val) return '';
  const normalized = normalizeDateString(val);
  if (normalized && normalized.length >= 7) {
    return normalized.substring(0, 7);
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}$/.test(str)) return str;
  return str.substring(0, 7);
}

export function formatDateIndo(dateStr, includeDay = false) {
  if (!dateStr) return '-';
  const normalized = normalizeDateString(dateStr);
  if (normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [yStr, mStr, dStr] = normalized.split('-');
    const year = parseInt(yStr, 10);
    const monthIdx = parseInt(mStr, 10) - 1;
    const day = parseInt(dStr, 10);
    const month = MONTH_NAMES_ID[monthIdx] || mStr;

    if (includeDay) {
      const date = new Date(year, monthIdx, day);
      const dayName = DAY_NAMES_ID[date.getDay()];
      return `${dayName}, ${day} ${month} ${year}`;
    }
    return `${day} ${month} ${year}`;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const dayName = DAY_NAMES_ID[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES_ID[date.getMonth()];
  const year = date.getFullYear();

  if (includeDay) {
    return `${dayName}, ${day} ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
}

export function formatMonthYear(yearMonthStr) {
  // Format YYYY-MM
  if (!yearMonthStr) return '';
  const parts = yearMonthStr.split('-');
  if (parts.length < 2) return yearMonthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_ID[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

export function getCurrentYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function addMonthsToPeriod(periodYM, monthsToAdd = 0) {
  if (!periodYM) return '';
  const [y, m] = periodYM.split('-').map(Number);
  const totalMonths = (y * 12 + (m - 1)) + monthsToAdd;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDaysDiffFromToday(targetDateStr) {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays; 
  // diffDays > 0: overdue by X days
  // diffDays === 0: due today
  // diffDays < 0: remaining X days
}

export function cleanWhatsAppNumber(phone) {
  if (!phone) return '';
  // Strip all non-digit characters (spaces, dashes, parentheses, +, dots)
  let cleaned = String(phone).replace(/\D/g, '');
  
  if (cleaned.startsWith('620')) {
    cleaned = '62' + cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function formatDisplayPhone(phone) {
  const clean = cleanWhatsAppNumber(phone);
  if (!clean) return '-';
  // Formats 6281234567890 to +62 812-3456-7890 using non-breaking space (\u00A0) and non-breaking hyphen (\u2011)
  if (clean.startsWith('62') && clean.length >= 10) {
    const prefix = '+62';
    const p1 = clean.substring(2, 5);
    const p2 = clean.substring(5, 9);
    const p3 = clean.substring(9);
    return `${prefix}\u00A0${p1}\u2011${p2}${p3 ? '\u2011' + p3 : ''}`;
  }
  return phone;
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Converts numbers into Indonesian word format ("terbilang")
 * Example: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilangRupiah(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Nol Rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function toWords(n) {
    if (n < 12) {
      return satuan[n];
    } else if (n < 20) {
      return toWords(n - 10) + ' Belas';
    } else if (n < 100) {
      return toWords(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + toWords(n % 10) : '');
    } else if (n < 200) {
      return 'Seratus' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    } else if (n < 1000) {
      return toWords(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    } else if (n < 2000) {
      return 'Seribu' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    } else if (n < 1000000) {
      return toWords(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    } else if (n < 1000000000) {
      return toWords(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + toWords(n % 1000000) : '');
    } else if (n < 1000000000000) {
      return toWords(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + toWords(n % 1000000000) : '');
    }
    return String(n);
  }

  const result = toWords(num).trim();
  return result + ' Rupiah';
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
