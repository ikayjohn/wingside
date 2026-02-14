/**
 * Supabase Image Optimization Utilities
 *
 * Next.js automatically optimizes Supabase images when using the <Image> component.
 * These utilities help with manual optimization when needed.
 */

/**
 * Get optimized Supabase image URL
 * Note: Supabase doesn't natively support URL transformations.
 * This function returns the original URL - optimization happens via Next.js Image component.
 *
 * @param url - Original Supabase storage URL
 * @returns Optimized URL (currently returns original, Next.js handles optimization)
 */
export function getOptimizedSupabaseUrl(url: string): string {
  // Next.js Image component handles optimization automatically
  // No need for manual URL transformation
  return url;
}

/**
 * Check if URL is from Supabase storage
 */
export function isSupabaseImage(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Helper to construct Supabase storage URLs
 */
export function getSupabaseStorageUrl(bucket: string, path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
