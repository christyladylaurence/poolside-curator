const DB_NAME = 'poolside-media';
const VIDEO_STORE = 'videos';
const TRACKS_STORE = 'tracks';
const VIDEO_KEY = 'bg-video';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE);
      }
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Video ---

export async function saveVideo(file: File): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(VIDEO_STORE, 'readwrite');
  tx.objectStore(VIDEO_STORE).put({ blob: file, name: file.name, type: file.type }, VIDEO_KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVideo(): Promise<File | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(VIDEO_STORE, 'readonly');
    const req = tx.objectStore(VIDEO_STORE).get(VIDEO_KEY);
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
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).delete(VIDEO_KEY);
  } catch {}
}

// --- Tracks ---

interface StoredTrack {
  id: string;
  name: string;
  raw: string;
  genre: string;
  date: string;
  dur: number;
  blob: Blob;
  fileName: string;
  fileType: string;
  originalName?: string | null;
  cutoff?: boolean;
}

export async function saveTracks(tracks: Array<{
  id: string; name: string; raw: string; genre: string;
  date: string; dur: number; file: File;
  originalName?: string | null; cutoff?: boolean;
}>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(TRACKS_STORE, 'readwrite');
  const store = tx.objectStore(TRACKS_STORE);
  // Clear old data first
  store.clear();
  const entries: StoredTrack[] = tracks.map(t => ({
    id: t.id,
    name: t.name,
    raw: t.raw,
    genre: t.genre,
    date: t.date,
    dur: t.dur,
    blob: t.file,
    fileName: t.file.name,
    fileType: t.file.type,
    originalName: t.originalName,
    cutoff: t.cutoff,
  }));
  store.put(entries, 'all-tracks');
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadTracks(): Promise<Array<{
  id: string; name: string; raw: string; genre: string;
  date: string; dur: number; file: File; url: string;
  originalName?: string | null; cutoff?: boolean;
}> | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRACKS_STORE, 'readonly');
    const req = tx.objectStore(TRACKS_STORE).get('all-tracks');
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const entries: StoredTrack[] | undefined = req.result;
        if (!entries?.length) { resolve(null); return; }
        const tracks = entries.map(e => {
          const file = new File([e.blob], e.fileName, { type: e.fileType });
          const url = URL.createObjectURL(file);
          return {
            id: e.id,
            name: e.name,
            raw: e.raw,
            genre: e.genre,
            date: e.date,
            dur: e.dur,
            file,
            url,
            originalName: e.originalName,
            cutoff: e.cutoff,
          };
        });
        resolve(tracks);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearTracks(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    tx.objectStore(TRACKS_STORE).clear();
  } catch {}
}
