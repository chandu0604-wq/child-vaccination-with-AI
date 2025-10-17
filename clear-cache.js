// Enhanced Cache Clearing Script for Chrome Extension
// Run this in Chrome DevTools console to force complete reload

console.log('🧹 Starting comprehensive cache clearing...');

async function clearAllCaches() {
  try {
    // 1. Clear all caches
    console.log('📦 Clearing all caches...');
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        console.log('🗑️ Deleting cache:', cacheName);
        await caches.delete(cacheName);
      })
    );
    console.log('✅ All caches cleared!');

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      console.log('🔄 Unregistering service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (registration) => {
          console.log('🗑️ Unregistering service worker:', registration.scope);
          await registration.unregister();
        })
      );
      console.log('✅ Service workers unregistered!');
    }

    // 3. Clear all storage
    console.log('💾 Clearing storage...');
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              console.log('🗑️ Deleting IndexedDB:', db.name);
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (e) {
        console.log('⚠️ IndexedDB clearing failed:', e);
      }
    }
    console.log('✅ Storage cleared!');

    // 4. Clear extension storage if available
    if (chrome && chrome.storage) {
      try {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        console.log('✅ Extension storage cleared!');
      } catch (e) {
        console.log('⚠️ Extension storage clearing failed:', e);
      }
    }

    console.log('🎉 All caches and storage cleared successfully!');
    console.log('🔄 Reloading in 2 seconds...');
    
    // Reload the page
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);

  } catch (error) {
    console.error('❌ Error during cache clearing:', error);
  }
}

// Execute the cache clearing
clearAllCaches();
