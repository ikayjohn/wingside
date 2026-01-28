/**
 * Clear all Wingside caches
 * Run this after making database changes that affect cached data
 */

import { clearAllCache } from '../lib/redis';

async function clearCache() {
  try {
    console.log('🧹 Starting cache clearance...');
    await clearAllCache();
    console.log('✅ All caches cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
