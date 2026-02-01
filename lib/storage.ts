/**
 * Safe LocalStorage Wrapper
 * Handles edge cases: private browsing, quota exceeded, unsupported browsers
 *
 * @example
 * ```typescript
 * import { storage } from '@/lib/storage';
 *
 * // Set item
 * storage.set('cart', cartData); // Returns true if successful
 *
 * // Get item
 * const cart = storage.get('cart', []); // Returns default if not found
 *
 * // Remove item
 * storage.remove('cart');
 * ```
 */

import { safeConsole } from './logger';

/**
 * Check if localStorage is available and functional
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side
  }

  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    // localStorage is not available (private browsing, quota exceeded, etc.)
    return false;
  }
}

/**
 * In-memory fallback storage for when localStorage is unavailable
 */
class MemoryStorage {
  private storage: Map<string, string> = new Map();

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
}

/**
 * Get storage backend (localStorage or memory fallback)
 */
function getStorage(): Storage | MemoryStorage {
  if (isLocalStorageAvailable()) {
    return window.localStorage;
  }

  // Fallback to memory storage
  safeConsole.warn('LocalStorage unavailable, using memory fallback');
  return new MemoryStorage();
}

/**
 * Safe localStorage wrapper with automatic JSON serialization
 */
export const storage = {
  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return isLocalStorageAvailable();
  },

  /**
   * Get storage type (for debugging)
   */
  getType(): 'localStorage' | 'memoryStorage' {
    return isLocalStorageAvailable() ? 'localStorage' : 'memoryStorage';
  },

  /**
   * Set item in storage with automatic JSON serialization
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON.stringify'd)
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T): boolean {
    try {
      const storage = getStorage();
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        safeConsole.error('LocalStorage quota exceeded', error);
      } else {
        safeConsole.error('Failed to save to storage', error);
      }
      return false;
    }
  },

  /**
   * Get item from storage with automatic JSON deserialization
   *
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist or parsing fails
   * @returns Stored value or defaultValue
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const storage = getStorage();
      const item = storage.getItem(key);

      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      safeConsole.error('Failed to read from storage', error);
      return defaultValue;
    }
  },

  /**
   * Remove item from storage
   *
   * @param key - Storage key to remove
   * @returns true if successful, false otherwise
   */
  remove(key: string): boolean {
    try {
      const storage = getStorage();
      storage.removeItem(key);
      return true;
    } catch (error) {
      safeConsole.error('Failed to remove from storage', error);
      return false;
    }
  },

  /**
   * Clear all items from storage
   *
   * @returns true if successful, false otherwise
   */
  clear(): boolean {
    try {
      const storage = getStorage();
      storage.clear();
      return true;
    } catch (error) {
      safeConsole.error('Failed to clear storage', error);
      return false;
    }
  },

  /**
   * Check if key exists in storage
   *
   * @param key - Storage key to check
   * @returns true if key exists
   */
  has(key: string): boolean {
    try {
      const storage = getStorage();
      return storage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get all keys from storage
   *
   * @returns Array of storage keys
   */
  keys(): string[] {
    try {
      const storage = getStorage();
      const keys: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }

      return keys;
    } catch (error) {
      safeConsole.error('Failed to get storage keys', error);
      return [];
    }
  },

  /**
   * Get storage size in bytes (approximate)
   *
   * @returns Size in bytes, or 0 if unavailable
   */
  getSize(): number {
    try {
      const storage = getStorage();
      let size = 0;

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key);
          if (value) {
            // Approximate size: key length + value length * 2 (UTF-16)
            size += (key.length + value.length) * 2;
          }
        }
      }

      return size;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Get storage size in human-readable format
   *
   * @returns Size string (e.g., "1.5 KB")
   */
  getSizeFormatted(): string {
    const bytes = storage.getSize();

    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};

/**
 * Session storage wrapper (same API as storage)
 * Automatically cleared when browser session ends
 */
export const sessionStorage = {
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const test = '__session_test__';
      window.sessionStorage.setItem(test, test);
      window.sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      if (!sessionStorage.isAvailable()) {
        return storage.set(key, value); // Fallback to localStorage
      }

      const serialized = JSON.stringify(value);
      window.sessionStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      safeConsole.error('Failed to save to session storage', error);
      return false;
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      if (!sessionStorage.isAvailable()) {
        return storage.get(key, defaultValue); // Fallback to localStorage
      }

      const item = window.sessionStorage.getItem(key);
      if (item === null) return defaultValue;

      return JSON.parse(item) as T;
    } catch (error) {
      safeConsole.error('Failed to read from session storage', error);
      return defaultValue;
    }
  },

  remove(key: string): boolean {
    try {
      if (sessionStorage.isAvailable()) {
        window.sessionStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  clear(): boolean {
    try {
      if (sessionStorage.isAvailable()) {
        window.sessionStorage.clear();
      }
      return true;
    } catch (error) {
      return false;
    }
  },
};

/**
 * Storage event listener for cross-tab communication
 *
 * @example
 * ```typescript
 * import { onStorageChange } from '@/lib/storage';
 *
 * const unsubscribe = onStorageChange('cart', (newValue, oldValue) => {
 *   console.log('Cart updated in another tab:', newValue);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export function onStorageChange<T>(
  key: string,
  callback: (newValue: T | null, oldValue: T | null) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }

  const handler = (event: StorageEvent) => {
    if (event.key !== key) return;

    try {
      const newValue = event.newValue ? JSON.parse(event.newValue) : null;
      const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
      callback(newValue, oldValue);
    } catch (error) {
      safeConsole.error('Error parsing storage change event', error);
    }
  };

  window.addEventListener('storage', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handler);
  };
}

/**
 * Default export for convenience
 */
export default storage;
