import { writable, derived } from 'svelte/store';
import storageManager from '../utils/storageManager.js';

// Recording state
export const isRecording = writable(false);
export const isPaused = writable(false);
export const recordingTime = writable(0);
export const recordedVideos = writable([]);
export const screenshots = writable([]);
export const currentRecording = writable(null);

// Derived stores
export const formattedTime = derived(recordingTime, $time => {
  const mins = Math.floor($time / 60);
  const secs = $time % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

export const hasRecordings = derived(recordedVideos, $videos => $videos.length > 0);
export const hasScreenshots = derived(screenshots, $shots => $shots.length > 0);

// Initialize storage and load persisted data
if (typeof window !== 'undefined') {
  // Initialize IndexedDB
  storageManager.initialize().then(async () => {
    console.log('🔄 Loading persisted data from IndexedDB...');
    
    try {
      // Load recordings
      const savedRecordings = await storageManager.getAllRecordings();
      if (savedRecordings.length > 0) {
        // Recreate blob URLs from stored blob data
        const recordingsWithUrls = savedRecordings.map(rec => {
          if (rec.blobData) {
            const blob = new Blob([rec.blobData], { type: 'video/webm' });
            return {
              ...rec,
              url: URL.createObjectURL(blob),
              blob: blob
            };
          }
          return rec;
        });
        recordedVideos.set(recordingsWithUrls);
        console.log(`✅ Loaded ${recordingsWithUrls.length} recordings`);
      }
      
      // Load screenshots
      const savedScreenshots = await storageManager.getAllScreenshots();
      if (savedScreenshots.length > 0) {
        screenshots.set(savedScreenshots);
        console.log(`✅ Loaded ${savedScreenshots.length} screenshots`);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }).catch(error => {
    console.error('Failed to initialize storage:', error);
  });
  
  // Clear old localStorage data
  localStorage.removeItem('nebulaRecordings');
  localStorage.removeItem('nebulaScreenshots');
}

// Helper function to save recordings to IndexedDB
export async function persistRecording(recording) {
  try {
    // Convert blob to array buffer for storage
    const blobData = recording.blob ? await recording.blob.arrayBuffer() : null;
    
    const recordingData = {
      ...recording,
      blobData,
      // Don't store temporary URLs
      url: undefined,
      blob: undefined
    };
    
    await storageManager.saveRecording(recordingData);
    console.log('✅ Recording persisted to IndexedDB');
  } catch (error) {
    console.error('Failed to persist recording:', error);
  }
}

// Helper function to save screenshots to IndexedDB
export async function persistScreenshot(screenshot) {
  try {
    await storageManager.saveScreenshot(screenshot);
    console.log('✅ Screenshot persisted to IndexedDB');
  } catch (error) {
    console.error('Failed to persist screenshot:', error);
  }
}

// Helper function to delete recording from IndexedDB
export async function deletePersistedRecording(id) {
  try {
    await storageManager.deleteRecording(id);
    console.log('✅ Recording deleted from IndexedDB');
  } catch (error) {
    console.error('Failed to delete recording:', error);
  }
}

// Helper function to delete screenshot from IndexedDB
export async function deletePersistedScreenshot(id) {
  try {
    await storageManager.deleteScreenshot(id);
    console.log('✅ Screenshot deleted from IndexedDB');
  } catch (error) {
    console.error('Failed to delete screenshot:', error);
  }
}
