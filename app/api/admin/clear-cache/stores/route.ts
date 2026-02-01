import { NextResponse } from 'next/server';
import { deleteFromCache, memoryCache, CACHE_KEYS } from '@/lib/redis';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/admin/clear-cache/stores - Clear stores cache
export async function GET() {
  // Require admin authentication
  const auth = await requireAdmin();
  if (!auth.success) return auth.error;

  try {
    console.log('🧹 Clearing stores cache...');

    // Clear Redis cache
    try {
      await deleteFromCache(CACHE_KEYS.STORES);
      console.log('✅ Redis cache cleared');
    } catch (redisError) {
      console.error('❌ Error clearing Redis cache:', redisError);
    }

    // Clear memory cache
    try {
      memoryCache.delete(CACHE_KEYS.STORES);
      console.log('✅ Memory cache cleared');
    } catch (memoryError) {
      console.error('❌ Error clearing memory cache:', memoryError);
    }

    return NextResponse.json({
      success: true,
      message: 'Stores cache cleared successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
