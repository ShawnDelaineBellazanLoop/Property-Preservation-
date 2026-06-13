import { PhotoEntry } from '../types';

const DB_NAME = 'tooensure-photos';
const DB_VERSION = 1;
const STORE = 'photos';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePhotos(stopId: string, photos: PhotoEntry[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  // Delete old photos for this stop first
  const all: IDBRequest<IDBCursorWithValue | null> = store.openCursor();
  await new Promise<void>((res) => {
    all.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        if ((cursor.value as { stopId: string }).stopId === stopId) cursor.delete();
        cursor.continue();
      } else res();
    };
    all.onerror = () => res();
  });
  for (const photo of photos) {
    store.put({ ...photo, stopId });
  }
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function loadPhotos(stopId: string): Promise<PhotoEntry[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const results: PhotoEntry[] = [];
  await new Promise<void>((res) => {
    const cursor = store.openCursor();
    cursor.onsuccess = (e) => {
      const c = (e.target as IDBRequest).result as IDBCursorWithValue | null;
      if (c) {
        if (c.value.stopId === stopId) {
          const { stopId: _sid, ...photo } = c.value;
          results.push(photo as PhotoEntry);
        }
        c.continue();
      } else res();
    };
    cursor.onerror = () => res();
  });
  db.close();
  return results.sort((a, b) => a.ts - b.ts);
}

export async function deleteStopPhotos(stopId: string): Promise<void> {
  await savePhotos(stopId, []);
}

/**
 * Returns true if a File is likely an image — checks MIME type first,
 * but falls back to file extension since some mobile browsers hand
 * back an empty/octet-stream MIME type for camera captures.
 */
export function isLikelyImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (file.type) return false; // explicit non-image type (e.g. video/*)
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name);
}

/**
 * Decodes a File into a canvas-drawable source + dimensions.
 * Tries createImageBitmap first (handles HEIC on Safari/iOS and is
 * generally more memory-efficient for large camera photos on Android),
 * falls back to <img> + data URL.
 */
async function decodeToDrawable(file: File): Promise<{ source: ImageBitmap | HTMLImageElement; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      console.log('[photo] decoded via createImageBitmap', bitmap.width, bitmap.height);
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch (err) {
      console.warn('[photo] createImageBitmap failed, falling back to <img>', err);
    }
  }

  const dataUrl = await new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const image = new Image();
    image.onload = () => res(image);
    image.onerror = () => rej(new Error('Image decode failed'));
    image.src = dataUrl;
  });

  console.log('[photo] decoded via <img>', img.naturalWidth, img.naturalHeight);
  return { source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
}

// Many mobile browsers cap canvas dimensions around 4096px per side or
// ~16-32 megapixels total. Camera photos (especially Samsung, often
// 12-108MP) can exceed this, causing toDataURL to return "data:," or throw.
const MAX_CANVAS_DIM = 4096;

function drawToCanvas(source: ImageBitmap | HTMLImageElement, srcW: number, srcH: number, maxDim: number, quality: number): string {
  const cap = Math.min(maxDim, MAX_CANVAS_DIM);
  const ratio = Math.min(1, cap / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * ratio));
  const h = Math.max(1, Math.round(srcH * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(source, 0, 0, w, h);
  const result = canvas.toDataURL('image/jpeg', quality);
  if (!result || result === 'data:,' || result.length < 100) {
    throw new Error(`toDataURL produced invalid output (canvas ${w}x${h}, result length ${result?.length ?? 0})`);
  }
  return result;
}

export async function compressPhoto(file: File): Promise<PhotoEntry> {
  console.log('[photo] compressPhoto start', { name: file.name, type: file.type, size: file.size });

  const MAX_DIM = 1600;
  const THUMB_DIM = 200;
  const QUALITY = 0.75;

  const { source, width, height } = await decodeToDrawable(file);

  let dataUrl: string;
  let thumb: string;
  try {
    dataUrl = drawToCanvas(source, width, height, MAX_DIM, QUALITY);
    thumb = drawToCanvas(source, width, height, THUMB_DIM, 0.65);
  } catch (err) {
    console.error('[photo] drawToCanvas failed', err);
    throw err;
  } finally {
    if ('close' in source && typeof source.close === 'function') source.close();
  }

  console.log('[photo] compressPhoto done', { dataUrlLen: dataUrl.length, thumbLen: thumb.length });

  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    thumb,
    name: file.name || `photo-${Date.now()}.jpg`,
    size: file.size,
    capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ts: Date.now(),
  };
}
