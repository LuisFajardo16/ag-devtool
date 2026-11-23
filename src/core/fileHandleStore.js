/**
 * Almacén ligero sobre IndexedDB para persistir FileSystemDirectoryHandle por workspace.
 * Permite recordar los directorios seleccionados entre recargas en navegadores con File System Access API.
 */

const DB_NAME = 'ag_devtool_fs_handles';
const STORE_NAME = 'directory_handles';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export const FileHandleStore = {
  async save(workspaceId, handle) {
    if (!workspaceId || !handle) return false;
    try {
      const db = await openDatabase();
      if (!db) return false;
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, workspaceId);
        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('[FileHandleStore] No se pudo guardar handle:', err);
      return false;
    }
  },

  async get(workspaceId) {
    if (!workspaceId) return null;
    try {
      const db = await openDatabase();
      if (!db) return null;
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(workspaceId);
        req.onsuccess = () => {
          db.close();
          resolve(req.result || null);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    } catch (err) {
      console.warn('[FileHandleStore] No se pudo leer handle:', err);
      return null;
    }
  },

  async remove(workspaceId) {
    if (!workspaceId) return false;
    try {
      const db = await openDatabase();
      if (!db) return false;
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(workspaceId);
        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('[FileHandleStore] No se pudo eliminar handle:', err);
      return false;
    }
  }
};
