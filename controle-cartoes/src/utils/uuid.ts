/**
 * Utility functions for the application
 */

/**
 * Generate UUID v4 with fallback for browsers that don't support crypto.randomUUID
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto.getRandomValues for secure random numbers
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits according to RFC 4122
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 10
    
    // Convert to hex string with dashes
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }
  
  // Final fallback using Math.random (less secure but compatible)
  console.warn('Using Math.random for UUID generation - not cryptographically secure');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateForDB(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
}

/**
 * Check if browser supports modern features
 */
export function getBrowserCapabilities() {
  return {
    hasWebAssembly: typeof WebAssembly !== 'undefined',
    hasCrypto: typeof crypto !== 'undefined',
    hasCryptoRandomUUID: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
    hasIndexedDB: typeof indexedDB !== 'undefined',
    hasLocalStorage: typeof localStorage !== 'undefined',
    hasServiceWorker: 'serviceWorker' in navigator,
  };
}
