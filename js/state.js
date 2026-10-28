/**
 * Juragankosan Reactive State Management & LocalStorage Sync
 */
import { generateId, getCurrentYearMonth, getTodayDateString, cleanWhatsAppNumber, addMonthsToPeriod } from './utils/formatter.js';
import { DEFAULT_WA_TEMPLATE } from './utils/whatsapp.js';
import { saveLocalSnapshot } from './utils/autoBackup.js';
import { queueCloudSync } from './utils/cloudBackup.js';

const STORAGE_KEY = 'juragankos_data_v1';

// Master Default Categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'exp_cat_listrik', name: 'Listrik / Token PLN', icon: '⚡', isDefault: true },
  { id: 'exp_cat_air', name: 'Air / PDAM', icon: '💧', isDefault: true },
  { id: 'exp_cat_wifi', name: 'WiFi / Internet', icon: '📶', isDefault: true },
  { id: 'exp_cat_kebersihan', name: 'Kebersihan & Sampah', icon: '🧹', isDefault: true },
  { id: 'exp_cat_perbaikan', name: 'Perbaikan / Maintenance', icon: '🔧', isDefault: true },
  { id: 'exp_cat_keamanan', name: 'Keamanan / Satpam', icon: '🛡️', isDefault: true },
  { id: 'exp_cat_perlengkapan', name: 'Perlengkapan Kos', icon: '🧻', isDefault: true },
  { id: 'exp_cat_lain', name: 'Lain-lain', icon: '📦', isDefault: true }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'inc_cat_sewa', name: 'Sewa Kamar', icon: '🏠', badgeClass: 'badge-emerald', isDefault: true },
  { id: 'inc_cat_parkir', name: 'Parkir Kendaraan', icon: '🛵', badgeClass: 'badge-blue', isDefault: true },
  { id: 'inc_cat_denda', name: 'Denda Keterlambatan', icon: '⚠️', badgeClass: 'badge-amber', isDefault: true },
  { id: 'inc_cat_layanan', name: 'Layanan Tambahan', icon: '🧺', badgeClass: 'badge-purple', isDefault: true },
  { id: 'inc_cat_token', name: 'Penjualan Token Listrik', icon: '⚡', badgeClass: 'badge-info', isDefault: true },
  { id: 'inc_cat_lain', name: 'Lain-lain', icon: '💰', badgeClass: 'badge-secondary', isDefault: true }
];

// Initial realistic sample data
export function getSampleData() {
  const currentYM = getCurrentYearMonth();
  const today = getTodayDateString();
  const [currentYear, currentMonth] = currentYM.split('-');
  const yearNum = parseInt(currentYear, 10);
  const monthNum = parseInt(currentMonth, 10);

  // Due dates for current month
  const pad = (n) => String(n).padStart(2, '0');
  const d5 = `${currentYear}-${currentMonth}-05`;
  const d10 = `${currentYear}-${currentMonth}-10`;
  const d18 = `${currentYear}-${currentMonth}-18`;
  const d25 = `${currentYear}-${currentMonth}-25`;

  const rooms = [
    {
      id: 'room_101',
      number: 'Kamar 101',
      type: 'VIP AC',
      floor: 'Lantai 1',
      price: 1800000,
      status: 'terisi',
      facilities: ['AC', 'Kamar Mandi Dalam', 'Kasur Springbed', 'WiFi', 'Lemari', 'Meja Kerja'],
      notes: 'Kamar depan, dekat gerbang masuk.',
      currentTenantId: 'tenant_01',
      createdAt: '2026-01-10'
    },
    {
      id: 'room_102',
      number: 'Kamar 102',
      type: 'Standar AC',
      floor: 'Lantai 1',
      price: 1500000,
      status: 'terisi',
      facilities: ['AC', 'Kamar Mandi Luar', 'Kasur Springbed', 'WiFi', 'Lemari'],
      notes: 'Jendela menghadap taman samping.',
      currentTenantId: 'tenant_02',
      createdAt: '2026-01-10'
    },
    {
      id: 'room_103',
      number: 'Kamar 103',
      type: 'Standar Non-AC',
      floor: 'Lantai 1',
      price: 950000,
      status: 'kosong',
      facilities: ['Kipas Angin', 'Kamar Mandi Dalam', 'Kasur Busa', 'Lemari'],
      notes: 'Siap huni, cat baru dan sprei bersih.',
      currentTenantId: null,
      createdAt: '2026-01-10'
    },
    {
      id: 'room_201',
      number: 'Kamar 201',
      type: 'VIP Balkon',
      floor: 'Lantai 2',
      price: 2100000,
      status: 'terisi',
      facilities: ['AC', 'Kamar Mandi Dalam', 'Balkon Pribadi', 'Kasur Queen', 'WiFi', 'Water Heater', 'Smart TV'],
      notes: 'Kamar favorit, sirkulasi udara sangat bagus.',
      currentTenantId: 'tenant_03',
      createdAt: '2026-02-01'
    },
    {
      id: 'room_202',
      number: 'Kamar 202',
      type: 'Standar AC',
      floor: 'Lantai 2',
      price: 1500000,
      status: 'terisi',
      facilities: ['AC', 'Kamar Mandi Luar', 'Kasur Springbed', 'WiFi', 'Lemari', 'Meja'],
      notes: 'Dekat area jemuran lantai 2.',
      currentTenantId: 'tenant_04',
      createdAt: '2026-02-01'
    },
    {
      id: 'room_203',
      number: 'Kamar 203',
      type: 'Standar Non-AC',
      floor: 'Lantai 2',
      price: 950000,
      status: 'kosong',
      facilities: ['Kipas Angin', 'Kasur Busa', 'Lemari'],
      notes: 'Baru selesai dibersihkan, siap disewa.',
      currentTenantId: null,
      createdAt: '2026-03-01'
    }
  ];

  const tenants = [
    {
      id: 'tenant_01',
      name: 'Dimas Pratama Putra',
      phone: '6281298765432',
      emergencyPhone: '6281211112222',
      emergencyContactName: 'Ibu Ratna (Ibu Kandung)',
      originAddress: 'Jl. Dago No. 12, Coblong, Bandung, Jawa Barat',
      idNumber: '3171052408980003',
      occupation: 'Karyawan Swasta (Tech)',
      roomId: 'room_101',
      roomNumber: 'Kamar 101',
      checkInDate: '2026-02-05',
      dueDay: 5,
      deposit: 500000,
      status: 'aktif',
      checkOutDate: null,
      notes: 'Kendaraan: Honda Vario B 1234 XYZ.',
      createdAt: '2026-02-05'
    },
    {
      id: 'tenant_02',
      name: 'Siti Nurhaliza',
      phone: '6285712345678',
      emergencyPhone: '6285299887766',
      emergencyContactName: 'Bpk. H. Rahmat (Ayah)',
      originAddress: 'Jl. Pajajaran No. 44, Bogor Tengah, Jawa Barat',
      idNumber: '3201124503000001',
      occupation: 'Mahasiswi Kedokteran',
      roomId: 'room_102',
      roomNumber: 'Kamar 102',
      checkInDate: '2026-03-10',
      dueDay: 10,
      deposit: 500000,
      status: 'aktif',
      checkOutDate: null,
      notes: 'Sering belajar larut malam, tenang & tertib.',
      createdAt: '2026-03-10'
    },
    {
      id: 'tenant_03',
      name: 'Budi Santoso',
      phone: '6281356789012',
      emergencyPhone: '6281765432100',
      emergencyContactName: 'Dewi Anggraeni (Istri)',
      originAddress: 'Jl. Slamet Riyadi No. 88, Surakarta (Solo), Jawa Tengah',
      idNumber: '3174091507950004',
      occupation: 'Arsitek Desain',
      roomId: 'room_201',
      roomNumber: 'Kamar 201',
      checkInDate: '2026-04-18',
      dueDay: 18,
      deposit: 1000000,
      status: 'aktif',
      checkOutDate: null,
      notes: 'Penyewa ramah, bayar sewa selalu tepat waktu.',
      createdAt: '2026-04-18'
    },
    {
      id: 'tenant_04',
      name: 'Anisa Rahmawati',
      phone: '6287890123456',
      emergencyPhone: '6281987654321',
      emergencyContactName: 'Bpk. Hendra (Ayah)',
      originAddress: 'Jl. Pemuda No. 25, Semarang Tengah, Jawa Tengah',
      idNumber: '3372015010990002',
      occupation: 'Pegawai Bank BUMN',
      roomId: 'room_202',
      roomNumber: 'Kamar 202',
      checkInDate: '2026-05-25',
      dueDay: 25,
      deposit: 500000,
      status: 'aktif',
      checkOutDate: null,
      notes: 'Penyewa baru, minta sprei dicuci tiap awal bulan.',
      createdAt: '2026-05-25'
    }
  ];

  const bills = [
    {
      id: 'bill_01',
      tenantId: 'tenant_01',
      tenantName: 'Dimas Pratama Putra',
      tenantPhone: '6281298765432',
      roomId: 'room_101',
      roomNumber: 'Kamar 101',
      period: currentYM,
      amount: 1800000,
      paidAmount: 1800000,
      remainingAmount: 0,
      dueDate: d5,
      status: 'lunas',
      paidDate: d5,
      paymentMethod: 'Transfer BCA',
      receiptNumber: `KW/${currentYear}${currentMonth}/101-01`,
      notes: 'Lunas tepat waktu via m-BCA.',
      payments: [
        {
          id: 'pay_01',
          date: d5,
          amount: 1800000,
          paymentMethod: 'Transfer BCA',
          receiptNumber: `KW/${currentYear}${currentMonth}/101-01`,
          notes: 'Lunas tepat waktu via m-BCA.',
          type: 'full'
        }
      ],
      createdAt: `${currentYear}-${currentMonth}-01`
    },
    {
      id: 'bill_02',
      tenantId: 'tenant_02',
      tenantName: 'Siti Nurhaliza',
      tenantPhone: '6285712345678',
      roomId: 'room_102',
      roomNumber: 'Kamar 102',
      period: currentYM,
      amount: 1500000,
      paidAmount: 0,
      remainingAmount: 1500000,
      dueDate: d10,
      status: 'belum_bayar',
      paidDate: null,
      paymentMethod: null,
      receiptNumber: null,
      payments: [],
      notes: 'Jatuh tempo tanggal 10.',
      createdAt: `${currentYear}-${currentMonth}-01`
    },
    {
      id: 'bill_03',
      tenantId: 'tenant_03',
      tenantName: 'Budi Santoso',
      tenantPhone: '6281356789012',
      roomId: 'room_201',
      roomNumber: 'Kamar 201',
      period: currentYM,
      amount: 2100000,
      paidAmount: 2100000,
      remainingAmount: 0,
      dueDate: d18,
      status: 'lunas',
      paidDate: `${currentYear}-${currentMonth}-15`,
      paymentMethod: 'Transfer Mandiri',
      receiptNumber: `KW/${currentYear}${currentMonth}/201-03`,
      notes: 'Bayar lebih awal 3 hari.',
      payments: [
        {
          id: 'pay_03',
          date: `${currentYear}-${currentMonth}-15`,
          amount: 2100000,
          paymentMethod: 'Transfer Mandiri',
          receiptNumber: `KW/${currentYear}${currentMonth}/201-03`,
          notes: 'Bayar lebih awal 3 hari.',
          type: 'full'
        }
      ],
      createdAt: `${currentYear}-${currentMonth}-01`
    },
    {
      id: 'bill_04',
      tenantId: 'tenant_04',
      tenantName: 'Anisa Rahmawati',
      tenantPhone: '6287890123456',
      roomId: 'room_202',
      roomNumber: 'Kamar 202',
      period: currentYM,
      amount: 1500000,
      paidAmount: 800000,
      remainingAmount: 700000,
      dueDate: d25,
      status: 'sebagian',
      paidDate: `${currentYear}-${currentMonth}-08`,
      paymentMethod: 'Transfer BCA',
      receiptNumber: `KW/${currentYear}${currentMonth}/202-C1`,
      notes: 'Dicicil Rp 800.000, sisa Rp 700.000 akan dilunasi tanggal 25.',
      payments: [
        {
          id: 'pay_04_c1',
          date: `${currentYear}-${currentMonth}-08`,
          amount: 800000,
          paymentMethod: 'Transfer BCA',
          receiptNumber: `KW/${currentYear}${currentMonth}/202-C1`,
          notes: 'Cicilan 1 sebesar Rp 800.000',
          type: 'partial',
          prevPaid: 0,
          remainingAfter: 700000
        }
      ],
      createdAt: `${currentYear}-${currentMonth}-01`
    }
  ];

  const expenses = [
    {
      id: 'exp_01',
      date: `${currentYear}-${currentMonth}-02`,
      period: currentYM,
      category: 'WiFi / Internet',
      amount: 385000,
      description: 'Langganan IndiHome Fiber 100 Mbps',
      createdAt: `${currentYear}-${currentMonth}-02`
    },
    {
      id: 'exp_02',
      date: `${currentYear}-${currentMonth}-04`,
      period: currentYM,
      category: 'Kebersihan & Sampah',
      amount: 150000,
      description: 'Iuran retribusi sampah & pembersihan lorong RT 04',
      createdAt: `${currentYear}-${currentMonth}-04`
    },
    {
      id: 'exp_03',
      date: `${currentYear}-${currentMonth}-08`,
      period: currentYM,
      category: 'Perbaikan / Maintenance',
      amount: 120000,
      description: 'Ganti kran shower bocor Kamar 103 & beli lem pipa',
      createdAt: `${currentYear}-${currentMonth}-08`
    }
  ];

  const incomes = [
    {
      id: 'inc_01',
      date: `${currentYear}-${currentMonth}-03`,
      period: currentYM,
      title: 'Tambahan Parkir Motor Bulanan',
      category: 'Parkir Kendaraan',
      amount: 100000,
      notes: 'Penyewa Kamar 101 membawa motor kedua',
      createdAt: `${currentYear}-${currentMonth}-03`
    },
    {
      id: 'inc_02',
      date: `${currentYear}-${currentMonth}-07`,
      period: currentYM,
      title: 'Denda Keterlambatan Sewa',
      category: 'Denda Keterlambatan',
      amount: 50000,
      notes: 'Denda keterlambatan sewa 2 hari',
      createdAt: `${currentYear}-${currentMonth}-07`
    },
    {
      id: 'inc_03',
      date: `${currentYear}-${currentMonth}-12`,
      period: currentYM,
      title: 'Penjualan Token Listrik Cadangan',
      category: 'Layanan Tambahan',
      amount: 105000,
      notes: 'Token PLN 100rb + biaya admin 5rb',
      createdAt: `${currentYear}-${currentMonth}-12`
    }
  ];

  const settings = {
    kosName: 'Griya Asri Harmoni Kost',
    ownerName: 'H. Ahmad Fauzi, S.E.',
    ownerPhone: '6281234567890',
    address: 'Jl. Margonda Raya No. 45, Beji, Depok, Jawa Barat',
    bankAccounts: [
      {
        id: 'bank_01',
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '7140-8899-22',
        accountHolder: 'H. Ahmad Fauzi'
      },
      {
        id: 'bank_02',
        bankName: 'Bank Mandiri',
        accountNumber: '157-00-0988231-1',
        accountHolder: 'H. Ahmad Fauzi'
      }
    ],
    bankName: 'Bank Central Asia (BCA)',
    bankAccount: '7140-8899-22',
    acceptCash: true,
    cashNote: 'Bayar tunai langsung ke Pengelola Kos',
    waTemplate: DEFAULT_WA_TEMPLATE,
    securityPin: '1234',
    theme: 'light',
    customExpenseCategories: [],
    customIncomeCategories: []
  };

  return {
    version: '1.0',
    rooms,
    tenants,
    bills,
    expenses,
    incomes,
    settings
  };
}

// Clean initial state for new users (0 Kamar, 0 Penyewa)
export function getEmptyData() {
  return {
    version: '1.0',
    rooms: [],
    tenants: [],
    bills: [],
    expenses: [],
    incomes: [],
    settings: {
      kosName: 'Juragankosan',
      ownerName: '',
      ownerPhone: '',
      address: '',
      bankAccounts: [
        {
          id: 'bank_01',
          bankName: 'BCA',
          accountNumber: '',
          accountHolder: ''
        }
      ],
      bankName: 'BCA',
      bankAccount: '',
      acceptCash: true,
      cashNote: 'Bayar tunai langsung ke Pengelola Kos',
      waTemplate: DEFAULT_WA_TEMPLATE,
      securityPin: '1234',
      theme: 'light',
      customExpenseCategories: [],
      customIncomeCategories: []
    }
  };
}

class Store {
  constructor() {
    if (typeof window !== 'undefined' && window.__juragankos_store) {
      return window.__juragankos_store;
    }
    this.data = this.loadData();
    this.listeners = [];
    if (typeof window !== 'undefined') {
      window.__juragankos_store = this;
    }
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.rooms)) {
          // Backward-compatibility check for emergency contact & origin address
          if (Array.isArray(parsed.tenants)) {
            const sampleMap = {
              tenant_01: {
                emergencyPhone: '6281211112222',
                emergencyContactName: 'Ibu Ratna (Ibu Kandung)',
                originAddress: 'Jl. Dago No. 12, Coblong, Bandung, Jawa Barat'
              },
              tenant_02: {
                emergencyPhone: '6285299887766',
                emergencyContactName: 'Bpk. H. Rahmat (Ayah)',
                originAddress: 'Jl. Pajajaran No. 44, Bogor Tengah, Jawa Barat'
              },
              tenant_03: {
                emergencyPhone: '6281765432100',
                emergencyContactName: 'Dewi Anggraeni (Istri)',
                originAddress: 'Jl. Slamet Riyadi No. 88, Surakarta (Solo), Jawa Tengah'
              },
              tenant_04: {
                emergencyPhone: '6281987654321',
                emergencyContactName: 'Bpk. Hendra (Ayah)',
                originAddress: 'Jl. Pemuda No. 25, Semarang Tengah, Jawa Tengah'
              }
            };
            let migrated = false;
            parsed.tenants.forEach((t) => {
              if (!t.emergencyPhone && sampleMap[t.id]) {
                t.emergencyPhone = sampleMap[t.id].emergencyPhone;
                migrated = true;
              }
              if (!t.emergencyContactName && sampleMap[t.id]) {
                t.emergencyContactName = sampleMap[t.id].emergencyContactName;
                migrated = true;
              }
              if (!t.originAddress && sampleMap[t.id]) {
                t.originAddress = sampleMap[t.id].originAddress;
                migrated = true;
              }
            });
            if (migrated) {
              this.saveDataDirect(parsed);
            }
          }

          // Migration for settings bank accounts & cash acceptance
          if (parsed.settings) {
            let settingsMigrated = false;
            if (!Array.isArray(parsed.settings.bankAccounts) || parsed.settings.bankAccounts.length === 0) {
              const legacyName = parsed.settings.bankName || 'Bank Central Asia (BCA)';
              const legacyNum = parsed.settings.bankAccount || '7140-8899-22';
              const legacyHolder = parsed.settings.ownerName || 'H. Ahmad Fauzi';
              parsed.settings.bankAccounts = [
                {
                  id: 'bank_01',
                  bankName: legacyName,
                  accountNumber: legacyNum,
                  accountHolder: legacyHolder
                }
              ];
              settingsMigrated = true;
            }
            if (parsed.settings.acceptCash === undefined) {
              parsed.settings.acceptCash = true;
              settingsMigrated = true;
            }
            if (!parsed.settings.cashNote) {
              parsed.settings.cashNote = 'Bayar tunai langsung ke Pengelola Kos';
              settingsMigrated = true;
            }
            if (!parsed.settings.securityPin) {
              parsed.settings.securityPin = '1234';
              settingsMigrated = true;
            }
            if (!Array.isArray(parsed.settings.customExpenseCategories)) {
              parsed.settings.customExpenseCategories = [];
              settingsMigrated = true;
            }
            if (!Array.isArray(parsed.settings.customIncomeCategories)) {
              parsed.settings.customIncomeCategories = [];
              settingsMigrated = true;
            }
            if (settingsMigrated) {
              this.saveDataDirect(parsed);
            }
          }

          // Migration for bills partial & advance payments
          if (Array.isArray(parsed.bills)) {
            let billsMigrated = false;
            parsed.bills.forEach((b) => {
              if (b.status === 'lunas') {
                if (b.paidAmount === undefined) { b.paidAmount = b.amount; billsMigrated = true; }
                if (b.remainingAmount === undefined) { b.remainingAmount = 0; billsMigrated = true; }
              } else if (b.status === 'sebagian') {
                if (b.paidAmount === undefined) { b.paidAmount = 0; billsMigrated = true; }
                if (b.remainingAmount === undefined) { b.remainingAmount = b.amount - b.paidAmount; billsMigrated = true; }
              } else {
                if (b.paidAmount === undefined) { b.paidAmount = 0; billsMigrated = true; }
                if (b.remainingAmount === undefined) { b.remainingAmount = b.amount; billsMigrated = true; }
              }
              if (!Array.isArray(b.payments)) {
                b.payments = [];
                billsMigrated = true;
                if (b.status === 'lunas' && b.paidDate) {
                  b.payments.push({
                    id: 'pay_init_' + b.id,
                    date: b.paidDate,
                    amount: b.amount,
                    paymentMethod: b.paymentMethod || 'Transfer BCA',
                    receiptNumber: b.receiptNumber || '',
                    notes: b.notes || 'Pelunasan sewa',
                    type: 'full'
                  });
                }
              }
            });
            if (billsMigrated) {
              this.saveDataDirect(parsed);
            }
          }

          // Ensure expenses and incomes exist
          if (!Array.isArray(parsed.expenses)) {
            parsed.expenses = [];
          }
          if (!Array.isArray(parsed.incomes)) {
            try {
              const jkIncomes = localStorage.getItem('jk_incomes');
              if (jkIncomes) {
                const parsedIncomes = JSON.parse(jkIncomes);
                if (Array.isArray(parsedIncomes)) {
                  parsed.incomes = parsedIncomes;
                }
              }
            } catch (e) {}
            if (!Array.isArray(parsed.incomes)) {
              parsed.incomes = [];
            }
          }

          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
    }
    const empty = getEmptyData();
    this.saveDataDirect(empty);
    return empty;
  }

  saveDataDirect(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (Array.isArray(data.incomes)) {
        localStorage.setItem('jk_incomes', JSON.stringify(data.incomes));
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  save() {
    this.saveDataDirect(this.data);
    this.notify();

    try {
      if (this.data && Array.isArray(this.data.rooms)) {
        // Simpan snapshot cadangan lokal otomatis ke IndexedDB (7 hari bergulir)
        saveLocalSnapshot(this.data, 'auto_mutation');
        // Antrekan sinkronisasi otomatis ke Cloud Safety Vault (di belakang layar)
        queueCloudSync(this.data, 4000);
      }
    } catch (e) {
      console.warn('Auto-backup trigger warning:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.data);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
    window.dispatchEvent(new CustomEvent('juragankos:statechange', { detail: this.data }));
  }

  // --- ROOMS MANAGEMENT ---
  getRooms() {
    return this.data.rooms || [];
  }

  getRoomById(id) {
    return this.getRooms().find((r) => r.id === id);
  }

  getVacantRooms() {
    return this.getRooms().filter((r) => r.status === 'kosong');
  }

  addRoom(roomData) {
    const price = parseInt(roomData.price, 10);
    if (isNaN(price) || price <= 0) {
      throw new Error('Harga sewa kamar harus berupa angka lebih dari 0.');
    }

    const newRoom = {
      id: generateId('room'),
      number: String(roomData.number || '').trim(),
      type: String(roomData.type || 'Standar').trim(),
      floor: String(roomData.floor || 'Lantai 1').trim(),
      price: price,
      status: 'kosong',
      facilities: Array.isArray(roomData.facilities) ? roomData.facilities : [],
      notes: String(roomData.notes || '').trim(),
      currentTenantId: null,
      createdAt: getTodayDateString()
    };
    this.data.rooms.push(newRoom);
    this.save();
    return newRoom;
  }

  updateRoom(id, roomData) {
    const index = this.data.rooms.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.data.rooms[index];
    let price = existing.price;
    if (roomData.price !== undefined) {
      const parsedPrice = parseInt(roomData.price, 10);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Harga sewa kamar harus berupa angka lebih dari 0.');
      }
      price = parsedPrice;
    }

    this.data.rooms[index] = {
      ...existing,
      number: roomData.number !== undefined ? String(roomData.number).trim() : existing.number,
      type: roomData.type !== undefined ? String(roomData.type).trim() : existing.type,
      floor: roomData.floor !== undefined ? String(roomData.floor).trim() : existing.floor,
      price: price,
      facilities: Array.isArray(roomData.facilities) ? roomData.facilities : existing.facilities,
      notes: roomData.notes !== undefined ? String(roomData.notes).trim() : existing.notes
    };

    // If room number changed, update in active tenant and bills
    if (roomData.number && roomData.number !== existing.number) {
      this.data.tenants.forEach((t) => {
        if (t.roomId === id) t.roomNumber = roomData.number;
      });
      this.data.bills.forEach((b) => {
        if (b.roomId === id) b.roomNumber = roomData.number;
      });
    }

    this.save();
    return this.data.rooms[index];
  }

  deleteRoom(id) {
    const room = this.getRoomById(id);
    if (!room) return { success: false, message: 'Kamar tidak ditemukan' };
    const hasActiveTenant = this.getActiveTenants().some((t) => t.roomId === id);
    if (room.status === 'terisi' || room.currentTenantId || hasActiveTenant) {
      return {
        success: false,
        message: 'Kamar sedang terisi oleh penyewa aktif! Silakan check-out penyewa terlebih dahulu sebelum menghapus kamar.'
      };
    }
    this.data.rooms = this.data.rooms.filter((r) => r.id !== id);
    this.save();
    return { success: true };
  }

  // --- TENANTS MANAGEMENT ---
  getTenants() {
    return this.data.tenants || [];
  }

  getActiveTenants() {
    return this.getTenants().filter((t) => t.status === 'aktif');
  }

  getTenantById(id) {
    return this.getTenants().find((t) => t.id === id);
  }

  addTenant(tenantData) {
    const hasRoom = Boolean(tenantData.roomId);
    let room = null;
    if (hasRoom) {
      room = this.getRoomById(tenantData.roomId);
      if (!room) {
        throw new Error('Kamar yang dipilih tidak valid.');
      }
      if (room.status === 'terisi') {
        throw new Error('Kamar ini sudah terisi penyewa lain.');
      }
    }

    const checkInDate = tenantData.checkInDate || getTodayDateString();
    const checkInDay = new Date(checkInDate).getDate() || 1;
    const dueDay = tenantData.dueDay ? parseInt(tenantData.dueDay, 10) : checkInDay;

    const newTenant = {
      id: generateId('tenant'),
      name: String(tenantData.name || '').trim(),
      phone: cleanWhatsAppNumber(tenantData.phone),
      emergencyPhone: tenantData.emergencyPhone ? cleanWhatsAppNumber(tenantData.emergencyPhone) : '',
      emergencyContactName: String(tenantData.emergencyContactName || '').trim(),
      originAddress: String(tenantData.originAddress || '').trim(),
      idNumber: String(tenantData.idNumber || '').trim(),
      occupation: String(tenantData.occupation || '').trim(),
      roomId: room ? room.id : null,
      roomNumber: room ? room.number : (tenantData.roomNumber || 'Belum Ada Kamar'),
      checkInDate: checkInDate,
      dueDay: dueDay,
      deposit: Math.max(0, parseInt(tenantData.deposit, 10) || 0),
      status: 'aktif',
      checkOutDate: null,
      notes: String(tenantData.notes || '').trim(),
      createdAt: getTodayDateString()
    };

    if (room) {
      // Auto-update room status
      room.status = 'terisi';
      room.currentTenantId = newTenant.id;
    }

    this.data.tenants.push(newTenant);

    if (room) {
      // Auto-generate bill untuk bulan pertama masuk & bulan berjalan aktif
      const currentYM = getCurrentYearMonth();
      const rawCheckIn = newTenant.checkInDate || '';
      const checkInYM = rawCheckIn ? String(rawCheckIn).trim().substring(0, 7) : '';
      if (checkInYM) {
        if (checkInYM <= currentYM) {
          let p = checkInYM;
          while (p <= currentYM) {
            this.ensureBillForTenant(newTenant, room, p);
            p = addMonthsToPeriod(p, 1);
          }
        } else {
          // Check-in masa depan (cth: bulan depan)
          this.ensureBillForTenant(newTenant, room, checkInYM);
        }
      } else {
        this.ensureBillForTenant(newTenant, room, currentYM);
      }
    }

    this.save();
    return newTenant;
  }

  updateTenant(id, tenantData) {
    const tenant = this.getTenantById(id);
    if (!tenant) return null;

    tenant.name = tenantData.name !== undefined ? String(tenantData.name).trim() : tenant.name;
    tenant.phone = tenantData.phone !== undefined ? cleanWhatsAppNumber(tenantData.phone) : tenant.phone;
    tenant.emergencyPhone =
      tenantData.emergencyPhone !== undefined
        ? (tenantData.emergencyPhone ? cleanWhatsAppNumber(tenantData.emergencyPhone) : '')
        : tenant.emergencyPhone;
    tenant.emergencyContactName =
      tenantData.emergencyContactName !== undefined
        ? String(tenantData.emergencyContactName).trim()
        : tenant.emergencyContactName;
    tenant.originAddress =
      tenantData.originAddress !== undefined
        ? String(tenantData.originAddress).trim()
        : tenant.originAddress;
    tenant.idNumber = tenantData.idNumber !== undefined ? String(tenantData.idNumber).trim() : tenant.idNumber;
    tenant.occupation = tenantData.occupation !== undefined ? String(tenantData.occupation).trim() : tenant.occupation;
    tenant.notes = tenantData.notes !== undefined ? String(tenantData.notes).trim() : tenant.notes;
    if (tenantData.deposit !== undefined) {
      tenant.deposit = Math.max(0, parseInt(tenantData.deposit, 10) || 0);
    }
    if (tenantData.dueDay !== undefined) {
      tenant.dueDay = parseInt(tenantData.dueDay, 10) || 1;
    }
    if (tenantData.checkInDate !== undefined) {
      tenant.checkInDate = tenantData.checkInDate;
    }

    // Room assignment / switching / unassigning
    if (tenantData.roomId !== undefined) {
      const newRoomId = tenantData.roomId || null;
      const oldRoomId = tenant.roomId || null;

      if (newRoomId !== oldRoomId) {
        // Release old room if exists
        if (oldRoomId) {
          const oldRoom = this.getRoomById(oldRoomId);
          if (oldRoom && oldRoom.currentTenantId === tenant.id) {
            oldRoom.status = 'kosong';
            oldRoom.currentTenantId = null;
          }
        }

        // Assign new room if provided
        if (newRoomId) {
          const newRoom = this.getRoomById(newRoomId);
          if (!newRoom) throw new Error('Kamar yang dipilih tidak valid.');
          if (newRoom.status === 'terisi' && newRoom.currentTenantId !== tenant.id) {
            throw new Error('Kamar ini sudah terisi penyewa lain.');
          }
          tenant.roomId = newRoom.id;
          tenant.roomNumber = newRoom.number;
          newRoom.status = 'terisi';
          newRoom.currentTenantId = tenant.id;

          // Auto-generate bill for active period if no bill exists yet
          const currentYM = getCurrentYearMonth();
          const rawCheckIn = tenant.checkInDate || '';
          const checkInYM = rawCheckIn ? String(rawCheckIn).trim().substring(0, 7) : '';
          const startYM = checkInYM && checkInYM <= currentYM ? checkInYM : currentYM;
          let p = startYM;
          while (p <= currentYM) {
            this.ensureBillForTenant(tenant, newRoom, p);
            p = addMonthsToPeriod(p, 1);
          }

          // Update room info in existing bills
          this.data.bills.forEach((b) => {
            if (b.tenantId === id) {
              b.roomId = newRoom.id;
              b.roomNumber = newRoom.number;
            }
          });
        } else {
          // Unassign room
          tenant.roomId = null;
          tenant.roomNumber = 'Belum Ada Kamar';
        }
      }
    }

    // Update in bills
    this.data.bills.forEach((b) => {
      if (b.tenantId === id) {
        b.tenantName = tenant.name;
        b.tenantPhone = tenant.phone;
      }
    });

    this.save();
    return tenant;
  }

  deleteTenant(tenantId) {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return false;

    // Release occupied room if any
    if (tenant.roomId) {
      const room = this.getRoomById(tenant.roomId);
      if (room && room.currentTenantId === tenant.id) {
        room.status = 'kosong';
        room.currentTenantId = null;
      }
    }

    this.data.tenants = this.data.tenants.filter((t) => t.id !== tenantId);
    this.save();
    return true;
  }

  checkOutTenant(tenantId, checkOutDate = getTodayDateString(), note = '') {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return { success: false, message: 'Penyewa tidak ditemukan' };

    tenant.status = 'keluar';
    tenant.checkOutDate = checkOutDate || getTodayDateString();
    if (note) {
      tenant.notes = tenant.notes ? `${tenant.notes}\n[Check-out ${tenant.checkOutDate}]: ${note}` : `[Check-out]: ${note}`;
    }

    // Auto-revert room to vacant
    if (tenant.roomId) {
      const room = this.getRoomById(tenant.roomId);
      if (room && room.currentTenantId === tenant.id) {
        room.status = 'kosong';
        room.currentTenantId = null;
      }
    }

    this.save();
    return { success: true };
  }

  // --- BILLS MANAGEMENT ---
  getBills() {
    return this.data.bills || [];
  }

  getBillById(id) {
    return this.getBills().find((b) => b.id === id);
  }

  getBillsByPeriod(periodStr) {
    return this.getBills().filter((b) => b.period === periodStr);
  }

  ensureBillForTenant(tenant, room, periodYM) {
    if (!tenant || !room || !periodYM) return null;

    // Aturan: Tagihan bulanan hanya boleh dibuat untuk bulan/periode yang sama dengan atau setelah bulan tanggal masuk penyewa
    const rawCheckIn = tenant.checkInDate || tenant.startDate || tenant.createdAt || '';
    const checkInYM = rawCheckIn ? String(rawCheckIn).trim().substring(0, 7) : '';
    if (checkInYM && periodYM < checkInYM) {
      return null;
    }

    // Jika penyewa sudah keluar, jangan buat tagihan untuk bulan setelah tanggal keluar
    if (tenant.status === 'keluar' && tenant.checkOutDate) {
      const checkOutYM = String(tenant.checkOutDate).trim().substring(0, 7);
      if (checkOutYM && periodYM > checkOutYM) {
        return null;
      }
    }

    const existing = this.data.bills.find(
      (b) => b.tenantId === tenant.id && b.period === periodYM
    );
    if (existing) return existing;

    const [y, m] = periodYM.split('-');
    const maxDaysInMonth = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
    const day = Math.min(maxDaysInMonth, Math.max(1, tenant.dueDay || 1));
    const pad = (n) => String(n).padStart(2, '0');
    const dueDate = `${y}-${m}-${pad(day)}`;

    const newBill = {
      id: generateId('bill'),
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantPhone: tenant.phone,
      roomId: room.id,
      roomNumber: room.number,
      period: periodYM,
      amount: room.price,
      paidAmount: 0,
      remainingAmount: room.price,
      dueDate: dueDate,
      status: 'belum_bayar',
      paidDate: null,
      paymentMethod: null,
      receiptNumber: null,
      payments: [],
      notes: '',
      createdAt: getTodayDateString()
    };

    this.data.bills.push(newBill);
    return newBill;
  }

  generateBillsForPeriod(periodYM) {
    const activeTenants = this.getActiveTenants();
    let generatedCount = 0;

    activeTenants.forEach((tenant) => {
      // Pastikan periode tagihan sama dengan atau setelah bulan tanggal masuk penyewa
      const rawCheckIn = tenant.checkInDate || tenant.startDate || tenant.createdAt || '';
      const checkInYM = rawCheckIn ? String(rawCheckIn).trim().substring(0, 7) : '';
      if (checkInYM && periodYM < checkInYM) {
        return;
      }

      const room = this.getRoomById(tenant.roomId);
      if (room) {
        const existing = this.data.bills.find(
          (b) => b.tenantId === tenant.id && b.period === periodYM
        );
        if (!existing) {
          const bill = this.ensureBillForTenant(tenant, room, periodYM);
          if (bill) {
            generatedCount++;
          }
        }
      }
    });

    if (generatedCount > 0) {
      this.save();
    }
    return generatedCount;
  }

  recordPayment(billId, paymentDetails = {}) {
    const bill = this.getBillById(billId);
    if (!bill) return null;

    const today = getTodayDateString();
    const type = paymentDetails.type || 'full'; // 'full' | 'partial' | 'advance'
    const paidDate = paymentDetails.paidDate || today;
    const paymentMethod = paymentDetails.paymentMethod || 'Transfer BCA';
    const notes = paymentDetails.notes || '';
    const cleanRoom = (bill.roomNumber || 'KAMAR').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    const [y, m] = bill.period.split('-');
    const seq = Math.floor(100 + Math.random() * 900);

    if (!Array.isArray(bill.payments)) bill.payments = [];

    if (type === 'partial') {
      const payAmount = Math.max(0, parseInt(paymentDetails.amount, 10) || 0);
      if (payAmount <= 0) {
        throw new Error('Nominal cicilan harus berupa angka lebih dari Rp 0.');
      }
      const prevPaid = bill.paidAmount || 0;
      const newPaid = prevPaid + payAmount;
      const newRemaining = Math.max(0, bill.amount - newPaid);
      const receiptNumber = `KW/${y}${m}/${cleanRoom}-C${bill.payments.length + 1}`;

      bill.paidAmount = newPaid;
      bill.remainingAmount = newRemaining;
      bill.paymentMethod = paymentMethod;

      const paymentRecord = {
        id: generateId('pay'),
        date: paidDate,
        amount: payAmount,
        paymentMethod: paymentMethod,
        receiptNumber: receiptNumber,
        notes: notes || `Cicilan ke-${bill.payments.length + 1}`,
        type: 'partial',
        prevPaid: prevPaid,
        remainingAfter: newRemaining
      };
      bill.payments.push(paymentRecord);

      if (newRemaining <= 0) {
        bill.status = 'lunas';
        bill.paidDate = paidDate;
        bill.receiptNumber = receiptNumber;
        bill.notes = notes ? `${notes} (Lunas lewat cicilan)` : 'Lunas lewat cicilan.';
      } else {
        bill.status = 'sebagian';
        bill.receiptNumber = receiptNumber;
        bill.notes = notes ? `${notes} (Sisa Rp ${newRemaining})` : `Dicicil sebagian. Sisa Rp ${newRemaining}.`;
      }

      this.save();
      return { bill, receiptNumber, paymentRecord, type: 'partial', payAmount, newRemaining };
    } 
    else if (type === 'advance') {
      const monthsCount = Math.max(1, parseInt(paymentDetails.advanceMonths, 10) || 1);
      const room = this.getRoomById(bill.roomId);
      const monthlyRate = room ? room.price : bill.amount;
      const totalAdvanceAmount = monthlyRate * monthsCount;
      const masterReceiptNumber = `KW-ADV/${y}${m}/${cleanRoom}-${seq}`;
      const endPeriod = addMonthsToPeriod(bill.period, monthsCount - 1);

      // 1. Mark current bill as lunas
      bill.status = 'lunas';
      bill.paidAmount = bill.amount;
      bill.remainingAmount = 0;
      bill.paidDate = paidDate;
      bill.paymentMethod = paymentMethod;
      bill.receiptNumber = masterReceiptNumber;
      bill.isAdvance = true;
      bill.advanceMonths = monthsCount;
      bill.advanceInfo = {
        totalMonths: monthsCount,
        periodStart: bill.period,
        periodEnd: endPeriod,
        totalAmount: totalAdvanceAmount,
        receiptNumber: masterReceiptNumber
      };
      bill.notes = notes ? `${notes} [Bayar Maju ${monthsCount} Bulan (${bill.period} s/d ${endPeriod})]` : `Bayar Maju ${monthsCount} Bulan (${bill.period} s/d ${endPeriod})`;

      bill.payments.push({
        id: generateId('pay'),
        date: paidDate,
        amount: monthlyRate,
        paymentMethod: paymentMethod,
        receiptNumber: masterReceiptNumber,
        notes: `Paket bayar maju bulan ke-1 (${bill.period})`,
        type: 'advance'
      });

      // 2. Auto-generate & mark as lunas the next (monthsCount - 1) bills
      const tenant = this.getTenantById(bill.tenantId);
      for (let i = 1; i < monthsCount; i++) {
        const nextPeriod = addMonthsToPeriod(bill.period, i);
        let futureBill = this.data.bills.find(
          (b) => b.tenantId === bill.tenantId && b.period === nextPeriod
        );

        if (!futureBill && tenant && room) {
          const [fy, fm] = nextPeriod.split('-');
          const fDay = Math.min(28, Math.max(1, tenant.dueDay || 1));
          const pad = (n) => String(n).padStart(2, '0');
          futureBill = {
            id: generateId('bill'),
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantPhone: tenant.phone,
            roomId: room.id,
            roomNumber: room.number,
            period: nextPeriod,
            amount: monthlyRate,
            paidAmount: monthlyRate,
            remainingAmount: 0,
            dueDate: `${fy}-${fm}-${pad(fDay)}`,
            status: 'lunas',
            paidDate: paidDate,
            paymentMethod: paymentMethod,
            receiptNumber: masterReceiptNumber,
            isAdvance: true,
            advanceMonths: monthsCount,
            advanceInfo: {
              totalMonths: monthsCount,
              periodStart: bill.period,
              periodEnd: endPeriod,
              totalAmount: totalAdvanceAmount,
              receiptNumber: masterReceiptNumber
            },
            payments: [
              {
                id: generateId('pay'),
                date: paidDate,
                amount: monthlyRate,
                paymentMethod: paymentMethod,
                receiptNumber: masterReceiptNumber,
                notes: `Paket bayar maju bulan ke-${i + 1} (${nextPeriod})`,
                type: 'advance'
              }
            ],
            notes: `Lunas via Pembayaran Maju ${monthsCount} Bulan (${bill.period} s/d ${endPeriod})`,
            createdAt: getTodayDateString()
          };
          this.data.bills.push(futureBill);
        } else if (futureBill) {
          futureBill.status = 'lunas';
          futureBill.paidAmount = futureBill.amount || monthlyRate;
          futureBill.remainingAmount = 0;
          futureBill.paidDate = paidDate;
          futureBill.paymentMethod = paymentMethod;
          futureBill.receiptNumber = masterReceiptNumber;
          futureBill.isAdvance = true;
          futureBill.advanceMonths = monthsCount;
          futureBill.advanceInfo = {
            totalMonths: monthsCount,
            periodStart: bill.period,
            periodEnd: endPeriod,
            totalAmount: totalAdvanceAmount,
            receiptNumber: masterReceiptNumber
          };
          futureBill.notes = `Lunas via Pembayaran Maju ${monthsCount} Bulan (${bill.period} s/d ${endPeriod})`;

          if (!Array.isArray(futureBill.payments)) futureBill.payments = [];
          futureBill.payments.push({
            id: generateId('pay'),
            date: paidDate,
            amount: futureBill.amount || monthlyRate,
            paymentMethod: paymentMethod,
            receiptNumber: masterReceiptNumber,
            notes: `Paket bayar maju bulan ke-${i + 1} (${nextPeriod})`,
            type: 'advance'
          });
        }
      }

      this.save();
      return {
        bill,
        receiptNumber: masterReceiptNumber,
        type: 'advance',
        monthsCount,
        totalAmount: totalAdvanceAmount,
        startPeriod: bill.period,
        endPeriod
      };
    } 
    else {
      // Default: Full 1-Month Payment
      const receiptNumber = `KW/${y}${m}/${cleanRoom}-${seq}`;
      const amountToPay = bill.remainingAmount !== undefined && bill.remainingAmount > 0
        ? bill.remainingAmount
        : bill.amount;

      bill.status = 'lunas';
      bill.paidAmount = bill.amount;
      bill.remainingAmount = 0;
      bill.paidDate = paidDate;
      bill.paymentMethod = paymentMethod;
      bill.receiptNumber = receiptNumber;
      if (notes) bill.notes = notes;

      bill.payments.push({
        id: generateId('pay'),
        date: paidDate,
        amount: amountToPay,
        paymentMethod: paymentMethod,
        receiptNumber: receiptNumber,
        notes: notes || 'Pelunasan sewa penuh',
        type: 'full'
      });

      this.save();
      return { bill, receiptNumber, type: 'full', amount: bill.amount };
    }
  }

  markBillPaid(billId, paymentDetails = {}) {
    const result = this.recordPayment(billId, { type: 'full', ...paymentDetails });
    return result ? result.bill : null;
  }

  revertBillPayment(billId) {
    const bill = this.getBillById(billId);
    if (!bill) return null;

    const receiptNum = bill.receiptNumber;
    const wasAdvance = bill.isAdvance || (receiptNum && receiptNum.startsWith('KW-ADV'));
    const tenantId = bill.tenantId;

    bill.status = 'belum_bayar';
    bill.paidAmount = 0;
    bill.remainingAmount = bill.amount;
    bill.paidDate = null;
    bill.paymentMethod = null;
    bill.receiptNumber = null;
    bill.payments = [];
    bill.isAdvance = false;
    delete bill.advanceMonths;
    delete bill.advanceInfo;
    bill.notes = '';

    // Jika tagihan adalah bagian paket bayar maju, batalkan juga tagihan masa depan terkait paket tersebut
    if (wasAdvance && receiptNum) {
      const linkedBills = this.data.bills.filter(
        (b) => b.tenantId === tenantId && b.receiptNumber === receiptNum && b.id !== bill.id
      );
      linkedBills.forEach((fb) => {
        fb.status = 'belum_bayar';
        fb.paidAmount = 0;
        fb.remainingAmount = fb.amount;
        fb.paidDate = null;
        fb.paymentMethod = null;
        fb.receiptNumber = null;
        fb.payments = [];
        fb.isAdvance = false;
        delete fb.advanceMonths;
        delete fb.advanceInfo;
        fb.notes = '';
      });
    }

    this.save();
    return bill;
  }

  // --- INCOMES MANAGEMENT ---
  getIncomes() {
    return this.data.incomes || [];
  }

  getIncomesByPeriod(periodYM) {
    return this.getIncomes().filter((inc) => {
      if (inc.period) return inc.period === periodYM;
      if (inc.date) return inc.date.startsWith(periodYM);
      return false;
    });
  }

  getIncomeById(id) {
    return this.getIncomes().find((inc) => inc.id === id);
  }

  addIncome(incomeData) {
    const amount = parseInt(incomeData.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pemasukan harus berupa angka lebih dari 0.');
    }
    const date = incomeData.date || getTodayDateString();
    const period = date.substring(0, 7);

    const newIncome = {
      id: generateId('inc'),
      date: date,
      period: period,
      title: String(incomeData.title || 'Pemasukan Lain-lain').trim(),
      category: String(incomeData.category || 'Lain-lain').trim(),
      amount: amount,
      notes: String(incomeData.notes || '').trim(),
      createdAt: getTodayDateString()
    };

    if (!Array.isArray(this.data.incomes)) {
      this.data.incomes = [];
    }
    this.data.incomes.push(newIncome);
    this.save();
    return newIncome;
  }

  updateIncome(id, incomeData) {
    const income = this.getIncomeById(id);
    if (!income) throw new Error('Data pemasukan tidak ditemukan.');

    if (incomeData.amount !== undefined) {
      const amount = parseInt(incomeData.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Nominal pemasukan harus berupa angka lebih dari 0.');
      }
      income.amount = amount;
    }
    if (incomeData.date) {
      income.date = incomeData.date;
      income.period = incomeData.date.substring(0, 7);
    }
    if (incomeData.title !== undefined) income.title = String(incomeData.title).trim();
    if (incomeData.category !== undefined) income.category = String(incomeData.category).trim();
    if (incomeData.notes !== undefined) income.notes = String(incomeData.notes).trim();

    this.save();
    return income;
  }

  deleteIncome(id) {
    if (!Array.isArray(this.data.incomes)) return true;
    this.data.incomes = this.data.incomes.filter((inc) => inc.id !== id);
    this.save();
    return true;
  }

  // --- EXPENSES MANAGEMENT ---
  getExpenses() {
    return this.data.expenses || [];
  }

  getExpensesByPeriod(periodYM) {
    return this.getExpenses().filter((e) => {
      if (e.period) return e.period === periodYM;
      if (e.date) return e.date.startsWith(periodYM);
      return false;
    });
  }

  getExpenseById(id) {
    return this.getExpenses().find((e) => e.id === id);
  }

  addExpense(expenseData) {
    const amount = parseInt(expenseData.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pengeluaran harus berupa angka lebih dari 0.');
    }
    const date = expenseData.date || getTodayDateString();
    const period = date.substring(0, 7);

    const newExpense = {
      id: generateId('exp'),
      date: date,
      period: period,
      category: String(expenseData.category || 'Lain-lain').trim(),
      amount: amount,
      description: String(expenseData.description || '').trim(),
      createdAt: getTodayDateString()
    };

    if (!Array.isArray(this.data.expenses)) {
      this.data.expenses = [];
    }
    this.data.expenses.push(newExpense);
    this.save();
    return newExpense;
  }

  updateExpense(id, expenseData) {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Data pengeluaran tidak ditemukan.');

    if (expenseData.amount !== undefined) {
      const amount = parseInt(expenseData.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Nominal pengeluaran harus berupa angka lebih dari 0.');
      }
      expense.amount = amount;
    }
    if (expenseData.date) {
      expense.date = expenseData.date;
      expense.period = expenseData.date.substring(0, 7);
    }
    if (expenseData.category !== undefined) expense.category = String(expenseData.category).trim();
    if (expenseData.description !== undefined) expense.description = String(expenseData.description).trim();

    this.save();
    return expense;
  }

  deleteExpense(id) {
    if (!Array.isArray(this.data.expenses)) return true;
    this.data.expenses = this.data.expenses.filter((e) => e.id !== id);
    this.save();
    return true;
  }

  // --- CATEGORIES MANAGEMENT (EXPENSE & INCOME) ---
  getExpenseCategories() {
    const custom = Array.isArray(this.data.settings?.customExpenseCategories)
      ? this.data.settings.customExpenseCategories
      : [];
    return [...DEFAULT_EXPENSE_CATEGORIES, ...custom];
  }

  addExpenseCategory({ name, icon }) {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      throw new Error('Nama kategori pengeluaran tidak boleh kosong.');
    }
    const all = this.getExpenseCategories();
    const isDup = all.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDup) {
      throw new Error(`Kategori "${trimmedName}" sudah ada.`);
    }

    if (!this.data.settings) this.data.settings = {};
    if (!Array.isArray(this.data.settings.customExpenseCategories)) {
      this.data.settings.customExpenseCategories = [];
    }

    const newCat = {
      id: generateId('cat_exp'),
      name: trimmedName,
      icon: icon || '🏷️',
      isCustom: true,
      createdAt: getTodayDateString()
    };

    this.data.settings.customExpenseCategories.push(newCat);
    this.save();
    return newCat;
  }

  deleteExpenseCategory(nameOrId) {
    if (!this.data.settings || !Array.isArray(this.data.settings.customExpenseCategories)) {
      return false;
    }
    const beforeLen = this.data.settings.customExpenseCategories.length;
    this.data.settings.customExpenseCategories = this.data.settings.customExpenseCategories.filter(
      (c) => c.id !== nameOrId && c.name !== nameOrId
    );
    if (this.data.settings.customExpenseCategories.length !== beforeLen) {
      this.save();
      return true;
    }
    return false;
  }

  getIncomeCategories() {
    const custom = Array.isArray(this.data.settings?.customIncomeCategories)
      ? this.data.settings.customIncomeCategories
      : [];
    return [...DEFAULT_INCOME_CATEGORIES, ...custom];
  }

  addIncomeCategory({ name, icon, badgeClass }) {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      throw new Error('Nama kategori pemasukan tidak boleh kosong.');
    }
    const all = this.getIncomeCategories();
    const isDup = all.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDup) {
      throw new Error(`Kategori "${trimmedName}" sudah ada.`);
    }

    if (!this.data.settings) this.data.settings = {};
    if (!Array.isArray(this.data.settings.customIncomeCategories)) {
      this.data.settings.customIncomeCategories = [];
    }

    const newCat = {
      id: generateId('cat_inc'),
      name: trimmedName,
      icon: icon || '✨',
      badgeClass: badgeClass || 'badge-purple',
      isCustom: true,
      createdAt: getTodayDateString()
    };

    this.data.settings.customIncomeCategories.push(newCat);
    this.save();
    return newCat;
  }

  deleteIncomeCategory(nameOrId) {
    if (!this.data.settings || !Array.isArray(this.data.settings.customIncomeCategories)) {
      return false;
    }
    const beforeLen = this.data.settings.customIncomeCategories.length;
    this.data.settings.customIncomeCategories = this.data.settings.customIncomeCategories.filter(
      (c) => c.id !== nameOrId && c.name !== nameOrId
    );
    if (this.data.settings.customIncomeCategories.length !== beforeLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- AUTOMATIC RENT & UNIFIED CASH FLOW INTEGRATION ---
  /**
   * Retrieves rental payments automatically from bills (Lunas & Dicicil)
   */
  getRentInflows(filter = {}) {
    const bills = this.getBills();
    const inflows = [];

    bills.forEach((bill) => {
      // Check if bill has payments array
      if (Array.isArray(bill.payments) && bill.payments.length > 0) {
        bill.payments.forEach((p, idx) => {
          const payDate = p.date || bill.paidDate || bill.dueDate || getTodayDateString();
          inflows.push({
            id: p.id || `rent_pay_${bill.id}_${idx}`,
            billId: bill.id,
            type: 'rent',
            isRent: true,
            date: payDate,
            period: payDate.substring(0, 7),
            billPeriod: bill.period,
            title: `Sewa ${bill.roomNumber} (${bill.tenantName})`,
            category: 'Sewa Kamar',
            amount: p.amount || 0,
            paymentMethod: p.paymentMethod || bill.paymentMethod || 'Transfer Bank',
            receiptNumber: p.receiptNumber || bill.receiptNumber || '-',
            notes: p.notes || (p.type === 'partial' ? 'Cicilan sewa' : (p.type === 'advance' ? `Sewa Maju (${bill.period})` : 'Pelunasan sewa')),
            tenantName: bill.tenantName,
            roomNumber: bill.roomNumber,
            billStatus: bill.status,
            isAdvance: bill.isAdvance || p.type === 'advance',
            advanceMonths: bill.advanceMonths
          });
        });
      } else if ((bill.status === 'lunas' || bill.status === 'sebagian') && (bill.paidAmount > 0 || bill.amount > 0)) {
        // Fallback for bills without explicit payments array
        const payAmount = bill.paidAmount !== undefined && bill.paidAmount > 0 ? bill.paidAmount : (bill.status === 'lunas' ? bill.amount : 0);
        if (payAmount > 0) {
          const payDate = bill.paidDate || bill.dueDate || getTodayDateString();
          inflows.push({
            id: `rent_${bill.id}`,
            billId: bill.id,
            type: 'rent',
            isRent: true,
            date: payDate,
            period: payDate.substring(0, 7),
            title: `Sewa ${bill.roomNumber} (${bill.tenantName})`,
            category: 'Sewa Kamar',
            amount: payAmount,
            paymentMethod: bill.paymentMethod || 'Transfer Bank',
            receiptNumber: bill.receiptNumber || '-',
            notes: bill.notes || (bill.status === 'sebagian' ? 'Cicilan sewa' : 'Pelunasan sewa'),
            tenantName: bill.tenantName,
            roomNumber: bill.roomNumber,
            billStatus: bill.status
          });
        }
      }
    });

    return inflows;
  }

  /**
   * Returns merged cash inflows (Rent payments + Other incomes)
   */
  getAllInflows() {
    const rentInflows = this.getRentInflows();
    const otherIncomes = this.getIncomes().map((inc) => ({
      id: inc.id,
      type: 'other_income',
      isRent: false,
      date: inc.date || getTodayDateString(),
      period: inc.period || (inc.date ? inc.date.substring(0, 7) : getTodayDateString().substring(0, 7)),
      title: inc.title || 'Pemasukan Lain-lain',
      category: inc.category || 'Lain-lain',
      amount: inc.amount || 0,
      paymentMethod: 'Kas Masuk',
      receiptNumber: '-',
      notes: inc.notes || '-',
      createdAt: inc.createdAt
    }));

    return [...rentInflows, ...otherIncomes].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // --- SETTINGS MANAGEMENT ---
  getSettings() {
    // Always re-sync from localStorage to guarantee 100% fresh real-time settings across tabs & views
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.settings) {
          this.data.settings = parsed.settings;
        }
      }
    } catch (e) {
      // Ignore localStorage parse error
    }

    const s = this.data.settings || {};
    if (!Array.isArray(s.bankAccounts) || s.bankAccounts.length === 0) {
      s.bankAccounts = [
        {
          id: 'bank_01',
          bankName: s.bankName || 'Bank Central Asia (BCA)',
          accountNumber: s.bankAccount || '',
          accountHolder: s.ownerName || ''
        }
      ];
    }
    if (s.acceptCash === undefined) s.acceptCash = true;
    if (!s.cashNote) s.cashNote = 'Bayar tunai langsung ke Pengelola Kos';
    if (!s.securityPin) s.securityPin = '1234';
    return s;
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...newSettings
    };

    // Keep legacy fallback in sync
    if (Array.isArray(updated.bankAccounts) && updated.bankAccounts.length > 0) {
      updated.bankName = updated.bankAccounts[0].bankName;
      updated.bankAccount = updated.bankAccounts[0].accountNumber;
    }

    this.data.settings = updated;
    this.save();
    return this.data.settings;
  }

  // --- DATA BACKUP, RESTORE & RESET ---
  exportDataJSON() {
    const jsonString = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Juragankosan-Backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importDataJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.tenants)) {
        throw new Error('Format file backup tidak valid.');
      }
      this.data = parsed;
      this.save();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Gagal memproses file JSON.' };
    }
  }

  resetToSampleData() {
    this.data = getSampleData();
    this.save();
  }

  clearAllData() {
    const currentPin = this.getSecurityPin();
    const emptyData = getEmptyData();
    if (currentPin) {
      emptyData.settings.securityPin = currentPin;
    }
    emptyData.rooms = [];
    emptyData.tenants = [];
    emptyData.bills = [];
    emptyData.expenses = [];
    emptyData.incomes = [];

    this.data = emptyData;
    this.saveDataDirect(emptyData);

    try {
      localStorage.removeItem('jk_incomes');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyData));
    } catch (e) {
      console.error('Failed to clear localStorage data:', e);
    }

    this.notify();
  }

  // --- SECURITY PIN MANAGEMENT ---
  getSecurityPin() {
    const s = this.getSettings();
    return s.securityPin || '1234';
  }

  verifySecurityPin(pin) {
    if (!pin) return false;
    return String(pin).trim() === String(this.getSecurityPin()).trim();
  }

  updateSecurityPin(oldPin, newPin) {
    const current = this.getSecurityPin();
    if (String(oldPin).trim() !== String(current).trim()) {
      return { success: false, message: 'PIN Lama salah!' };
    }
    const cleanNew = String(newPin).trim();
    if (!/^\d{4,6}$/.test(cleanNew)) {
      return { success: false, message: 'PIN Baru harus terdiri dari 4 hingga 6 digit angka!' };
    }
    this.updateSettings({ securityPin: cleanNew });
    return { success: true, message: 'PIN Keamanan berhasil diperbarui!' };
  }

  resetSecurityPin() {
    this.updateSettings({ securityPin: '1234' });
    return '1234';
  }

  // --- APP LOCK (LOGIN PIN KEAMANAN) ---
  isAppLocked() {
    try {
      return sessionStorage.getItem('juragankos_app_unlocked') !== 'true';
    } catch (e) {
      return false;
    }
  }

  unlockApp(pin) {
    if (this.verifySecurityPin(pin)) {
      try {
        sessionStorage.setItem('juragankos_app_unlocked', 'true');
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('juragankos:app_unlocked'));
      return true;
    }
    return false;
  }

  lockApp() {
    try {
      sessionStorage.removeItem('juragankos_app_unlocked');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('juragankos:app_locked'));
  }
}

export { Store };
export const store = (typeof window !== 'undefined' && window.__juragankos_store)
  ? window.__juragankos_store
  : new Store();
