/**
 * IndexedDB photo storage — bypasses the 5MB localStorage limit.
 * Photos are stored by stopId in a dedicated object store.
 * Everything else (checklist state, notes) stays in localStorage.
 */

const DB_NAME = 'tooensure_photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'stopId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface StoredPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
}

export async function savePhotos(stopId: string, photos: StoredPhoto[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ stopId, photos });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB savePhotos error:', err);
  }
}

export async function loadPhotos(stopId: string): Promise<StoredPhoto[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(stopId);
      req.onsuccess = () => resolve(req.result?.photos ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB loadPhotos error:', err);
    return [];
  }
}

export async function deletePhotos(stopId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(stopId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB deletePhotos error:', err);
  }
}

export async function loadAllPhotos(stopIds: string[]): Promise<Record<string, StoredPhoto[]>> {
  const result: Record<string, StoredPhoto[]> = {};
  await Promise.all(stopIds.map(async (id) => {
    result[id] = await loadPhotos(id);
  }));
  return result;
}
