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
  if (loadPromise) {
    return loadPromise;
  }

  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    isLoading = true;

    // Create the bootstrap script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };

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
  await bootstrapGoogleMaps();
  
  if (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
    throw new Error('Google Maps not loaded correctly');
  }

  return await window.google.maps.importLibrary(libraryName);
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
