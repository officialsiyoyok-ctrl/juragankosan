/**
 * Juragankosan Local Hardening & Auto-Backup Engine
 * 1. Persistent Storage API (navigator.storage.persist) - Anti browser cache eviction
 * 2. IndexedDB Rolling Snapshots (Vault Darurat 7 Hari Terakhir)
 */

const DB_NAME = 'JuragankosBackupVault';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const MAX_LOCAL_SNAPSHOTS = 7;

let dbInstance = null;

/**
 * Inisialisasi Database IndexedDB untuk Snapshot Lokal
 */
export function openBackupDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB tidak didukung pada peramban ini.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('dateString', 'dateString', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('Gagal membuka IndexedDB Juragan Backup Vault:', e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * 1. PERSISTENT STORAGE API
 * Meminta izin ke browser (Android Chrome, iOS Safari) agar penyimpanan tidak dihapus otomatis
 */
export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) {
        return { persisted: true, granted: true, message: 'Penyimpanan lokal sudah berstatus permanen (terproteksi).' };
      }
      const granted = await navigator.storage.persist();
      return {
        persisted: granted,
        granted,
        message: granted
          ? 'Browser telah memberikan proteksi penyimpanan permanen untuk Juragankosan.'
          : 'Penyimpanan lokal aktif dalam mode standar browser.'
      };
    } catch (err) {
      console.warn('Persistent storage request error:', err);
      return { persisted: false, granted: false, message: 'Gagal meminta penyimpanan permanen.' };
    }
  }
  return { persisted: false, granted: false, message: 'Storage API tidak didukung browser ini.' };
}

/**
 * Cek apakah penyimpanan saat ini sudah berstatus persist
 */
export async function checkStoragePersistence() {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Estimasi kuota penyimpanan browser (MB digunakan / MB tersedia)
 */
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      const usageMB = (usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (quota / (1024 * 1024)).toFixed(0);
      return { usageMB, quotaMB };
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 2. INDEXEDDB ROLLING SNAPSHOTS
 * Simpan snapshot lokal otomatis ke IndexedDB (maksimal 7 snapshot bergulir)
 */
export async function saveLocalSnapshot(data, reason = 'auto') {
  if (!data || !Array.isArray(data.rooms)) return null;

  try {
    const db = await openBackupDB();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const id = `snap_${now.getTime()}`;

    const snapshotRecord = {
      id,
      timestamp: now.getTime(),
      dateString: dateStr,
      timeString: timeStr,
      isoDate: now.toISOString(),
      reason,
      summary: {
        kosName: data.settings?.kosName || 'Juragankosan',
        ownerName: data.settings?.ownerName || '',
        ownerPhone: data.settings?.ownerPhone || '',
        roomsCount: data.rooms.length,
        tenantsCount: (data.tenants || []).length,
        billsCount: (data.bills || []).length,
        expensesCount: (data.expenses || []).length,
        incomesCount: (data.incomes || []).length
      },
      data: JSON.parse(JSON.stringify(data))
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(snapshotRecord);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });

    // Prune snapshot lama jika melebihi MAX_LOCAL_SNAPSHOTS
    await pruneOldSnapshots(MAX_LOCAL_SNAPSHOTS);

    // Simpan metadata snapshot terakhir di localStorage untuk UI cepat
    try {
      localStorage.setItem('juragankos_last_local_snapshot', JSON.stringify({
        id,
        timestamp: snapshotRecord.timestamp,
        dateString: dateStr,
        timeString: timeStr,
        summary: snapshotRecord.summary
      }));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('juragankos:snapshot_saved', { detail: snapshotRecord }));
    return snapshotRecord;
  } catch (err) {
    console.warn('Gagal menyimpan snapshot lokal ke IndexedDB:', err);
    return null;
  }
}

/**
 * Pangkas snapshot tertua agar kapasitas IndexedDB tetap ramping (maksimal 7 snapshot)
 */
async function pruneOldSnapshots(keepCount = MAX_LOCAL_SNAPSHOTS) {
  try {
    const db = await openBackupDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const allRecords = [];
    const cursorReq = index.openCursor(null, 'prev'); // Urut dari yang terbaru ke terlama

    await new Promise((resolve) => {
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          allRecords.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    if (allRecords.length > keepCount) {
      const deleteTx = db.transaction(STORE_NAME, 'readwrite');
      const deleteStore = deleteTx.objectStore(STORE_NAME);
      const toDelete = allRecords.slice(keepCount);
      for (const item of toDelete) {
        deleteStore.delete(item.id);
      }
    }
  } catch (e) {
    console.warn('Prune old snapshots warning:', e);
  }
}

/**
 * Ambil semua snapshot lokal yang tersedia
 */
export async function getLocalSnapshots() {
  try {
    const db = await openBackupDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const list = [];
    const cursorReq = index.openCursor(null, 'prev'); // Urutan terbaru paling atas

    return await new Promise((resolve) => {
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          list.push({
            id: cursor.value.id,
            timestamp: cursor.value.timestamp,
            dateString: cursor.value.dateString,
            timeString: cursor.value.timeString,
            reason: cursor.value.reason,
            summary: cursor.value.summary
          });
          cursor.continue();
        } else {
          resolve(list);
        }
      };
      cursorReq.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Ambil detail 1 snapshot lokal beserta data lengkapnya
 */
export async function getSnapshotById(id) {
  try {
    const db = await openBackupDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    return await new Promise((resolve, reject) => {
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

/**
 * 3. EMERGENCY RECOVERY CHECK
 * Mendeteksi jika localStorage kosong (misal cache dibersihkan / kecelakaan reset)
 * padahal di IndexedDB masih ada data snapshot yang selamat!
 */
export async function checkEmergencyRecovery(currentData) {
  // Hanya picu jika data saat ini benar-benar kosong (0 kamar dan 0 penyewa)
  const isCurrentEmpty = !currentData || (!currentData.rooms?.length && !currentData.tenants?.length);
  if (!isCurrentEmpty) return null;

  try {
    const snapshots = await getLocalSnapshots();
    if (!snapshots || snapshots.length === 0) return null;

    // Cari snapshot terbaru yang memiliki data riil (kamar > 0)
    for (const snap of snapshots) {
      if (snap.summary && snap.summary.roomsCount > 0) {
        const fullSnap = await getSnapshotById(snap.id);
        if (fullSnap && fullSnap.data) {
          return {
            snapshotId: snap.id,
            timestamp: snap.timestamp,
            dateString: snap.dateString,
            timeString: snap.timeString,
            summary: snap.summary,
            data: fullSnap.data
          };
        }
      }
    }
  } catch (e) {
    console.warn('Emergency recovery check error:', e);
  }
  return null;
}
