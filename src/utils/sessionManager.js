// Session Management Utilities for Nebula Video Editor
// Provides IndexedDB storage and custom binary format export

const DB_NAME = 'NebulaEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

// Save session to IndexedDB (fast, handles binary data efficiently)
export async function saveSessionToIndexedDB(sessionData) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Add timestamp if not present
    if (!sessionData.timestamp) {
      sessionData.timestamp = new Date().toISOString();
    }
    
    const request = store.add(sessionData);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save session to IndexedDB:', error);
    throw error;
  }
}

// Get all sessions from IndexedDB
export async function getAllSessions() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get sessions from IndexedDB:', error);
    throw error;
  }
}

// Get a specific session by ID
export async function getSessionById(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get session from IndexedDB:', error);
    throw error;
  }
}

// Delete a session by ID
export async function deleteSessionById(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete session from IndexedDB:', error);
    throw error;
  }
}

// Export session to .neb file (custom binary format)
export async function exportSessionToFile(sessionData, fileName) {
  try {
    const files = [];
    const fileMap = new Map();
    
    // Collect all unique files
    const collectFile = (file) => {
      if (!file || fileMap.has(file.name + file.size)) return fileMap.get(file.name + file.size);
      const id = files.length;
      files.push(file);
      fileMap.set(file.name + file.size, id);
      return id;
    };
    
    // Build metadata with file references
    const metadata = {
      ...sessionData,
      clips: sessionData.clips?.map(clip => ({
        ...clip,
        fileId: collectFile(clip.file),
        file: undefined // Remove file object from metadata
      })),
      tracks: sessionData.tracks?.map(track => ({
        ...track,
        clips: track.clips?.map(clip => ({
          ...clip,
          fileId: collectFile(clip.file),
          file: undefined // Remove file object from metadata
        }))
      }))
    };
    
    // Create metadata blob
    const metadataJson = JSON.stringify(metadata);
    const metadataSize = new Uint32Array([metadataJson.length]);
    
    // Build file structure:
    // [4 bytes: metadata size] [metadata JSON] [file1] [file2] ...
    const chunks = [
      metadataSize,
      new Blob([metadataJson], { type: 'application/json' })
    ];
    
    // Add all files
    for (const file of files) {
      chunks.push(file);
    }
    
    // Combine into single blob
    const archiveBlob = new Blob(chunks, { type: 'application/octet-stream' });
    
    // Download
    const url = URL.createObjectURL(archiveBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `session_${Date.now()}.neb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export session to file:', error);
    throw error;
  }
}

// Import session from .neb file
export async function importSessionFromFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Read metadata size (first 4 bytes)
    const metadataSize = new Uint32Array(arrayBuffer.slice(0, 4))[0];
    
    // Read metadata JSON
    const metadataBytes = arrayBuffer.slice(4, 4 + metadataSize);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataJson);
    
    // Read files
    let offset = 4 + metadataSize;
    const files = [];
    
    // We need to know file sizes - this would require storing them in metadata
    // For now, this is a simplified version
    // In a full implementation, we'd store file sizes and types in metadata
    
    return metadata;
  } catch (error) {
    console.error('Failed to import session from file:', error);
    throw error;
  }
}

// Convert base64 to File (for legacy JSON format)
export function base64ToFile(base64Data, fileName, fileType) {
  if (!base64Data) return null;
  try {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime || fileType });
  } catch (error) {
    console.error('Failed to convert base64 to file:', error);
    return null;
  }
}

// Convert File to base64 (for legacy JSON format)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
