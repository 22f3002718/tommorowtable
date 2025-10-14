// Google Maps API Loader Utility
// Uses the new bootstrap loader approach recommended by Google

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

let isLoading = false;
let isLoaded = false;
let loadPromise = null;

/**
 * Bootstrap Google Maps JavaScript API
 * This initializes the google.maps.importLibrary function
 */
function bootstrapGoogleMaps() {
  console.log('[GoogleMapsLoader] bootstrapGoogleMaps called');
  
  if (loadPromise) {
    console.log('[GoogleMapsLoader] Returning existing promise');
    return loadPromise;
  }

  if (isLoaded && window.google && window.google.maps) {
    console.log('[GoogleMapsLoader] Already loaded, returning resolved promise');
    return Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('[GoogleMapsLoader] API key not found');
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    console.log('[GoogleMapsLoader] API key found, loading script...');
    isLoading = true;

    // Create a unique callback name
    const callbackName = 'initGoogleMaps_' + Date.now();
    
    // Define the callback
    window[callbackName] = () => {
      console.log('[GoogleMapsLoader] Callback executed, Maps loaded!');
      isLoaded = true;
      isLoading = false;
      delete window[callbackName];
      resolve();
    };

    // Create the bootstrap script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error('[GoogleMapsLoader] Script loading failed');
      isLoading = false;
      delete window[callbackName];
      reject(new Error('Failed to load Google Maps'));
    };

    console.log('[GoogleMapsLoader] Appending script to head');
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Load a specific Google Maps library
 * @param {string} libraryName - Name of the library to load (e.g., 'maps', 'places', 'marker', 'routes')
 * @returns {Promise} Promise that resolves with the library object
 */
export async function loadGoogleMapsLibrary(libraryName) {
  console.log(`[GoogleMapsLoader] Loading library: ${libraryName}`);
  
  try {
    await bootstrapGoogleMaps();
    console.log(`[GoogleMapsLoader] Bootstrap complete, importing ${libraryName}`);
    
    if (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
      throw new Error('Google Maps not loaded correctly');
    }

    const library = await window.google.maps.importLibrary(libraryName);
    console.log(`[GoogleMapsLoader] Library ${libraryName} loaded successfully`);
    return library;
  } catch (error) {
    console.error(`[GoogleMapsLoader] Error loading ${libraryName}:`, error);
    throw error;
  }
}

/**
 * Load multiple Google Maps libraries
 * @param {Array<string>} libraryNames - Array of library names to load
 * @returns {Promise<Object>} Promise that resolves with an object containing all loaded libraries
 */
export async function loadGoogleMapsLibraries(libraryNames) {
  await bootstrapGoogleMaps();

  const libraries = {};
  for (const name of libraryNames) {
    libraries[name] = await window.google.maps.importLibrary(name);
  }
  
  return libraries;
}

/**
 * Check if Google Maps is loaded
 * @returns {boolean}
 */
export function isGoogleMapsLoaded() {
  return isLoaded && window.google && window.google.maps;
}
