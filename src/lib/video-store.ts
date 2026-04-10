const DB_NAME = 'poolside-video';
const STORE = 'videos';
const KEY = 'bg-video';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideo(file: File): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put({ blob: file, name: file.name, type: file.type }, KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVideo(): Promise<File | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const result = req.result;
        if (result?.blob) {
          const file = new File([result.blob], result.name, { type: result.type });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearVideo(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
  } catch {}
}
