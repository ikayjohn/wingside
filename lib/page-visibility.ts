/**
 * Page Visibility Utilities
 *
 * Helper functions for managing page visibility based on site settings.
 * Used by navigation components to conditionally render links.
 */

import { SiteSettings } from '@/lib/settings';
import { NAVIGATION_LINKS, NavigationLink } from '@/lib/navigation-links';

/**
 * Check if a page is visible based on settings
 *
 * @param settings - Site settings object (partial for safety)
 * @param pageId - Unique page identifier (e.g., "wingclub")
 * @returns true if page should be visible, false if hidden
 *
 * Default behavior: Pages are visible unless explicitly set to 'false'
 * This ensures backward compatibility when settings are missing
 */
export function isPageVisible(
  settings: Partial<SiteSettings>,
  pageId: string
): boolean {
  const link = NAVIGATION_LINKS.find(l => l.id === pageId);

  // Always show pages marked as alwaysVisible (e.g., Terms, Privacy)
  if (link?.alwaysVisible) {
    return true;
  }

  // Build the setting key (e.g., "page_visible_wingclub")
  const settingKey = `page_visible_${pageId}` as keyof SiteSettings;
  const value = settings[settingKey];

  // Explicit 'false' means hidden, anything else (including undefined) means visible
  // This provides backward compatibility - new pages are visible by default
  return value !== 'false';
}

/**
 * Filter navigation links based on visibility settings
 *
 * @param settings - Site settings object
 * @param section - Navigation section to filter
 * @returns Array of visible links for the specified section
 *
 * Example usage:
 * ```typescript
 * const settings = await fetchSettings();
 * const visibleLinks = getVisibleLinks(settings, 'header');
 * ```
 */
export function getVisibleLinks(
  settings: Partial<SiteSettings>,
  section: NavigationLink['section']
): NavigationLink[] {
  return NAVIGATION_LINKS
    .filter(link => link.section === section)
    .filter(link => isPageVisible(settings, link.id));
}

/**
 * Check if an entire section should be hidden
 * (useful for conditionally rendering section headers)
 *
 * @param settings - Site settings object
 * @param section - Navigation section to check
 * @returns true if at least one link in the section is visible
 */
export function isSectionVisible(
  settings: Partial<SiteSettings>,
  section: NavigationLink['section']
): boolean {
  return getVisibleLinks(settings, section).length > 0;
}

/**
 * Get all visible links across all sections
 * (useful for sitemap generation or analytics)
 *
 * @param settings - Site settings object
 * @returns Array of all visible links
 */
export function getAllVisibleLinks(
  settings: Partial<SiteSettings>
): NavigationLink[] {
  return NAVIGATION_LINKS.filter(link => isPageVisible(settings, link.id));
}

/**
 * Get visibility statistics
 * (useful for admin dashboard or debugging)
 *
 * @param settings - Site settings object
 * @returns Object with visibility counts per section
 */
export function getVisibilityStats(settings: Partial<SiteSettings>) {
  const stats = {
    header: { total: 0, visible: 0, hidden: 0 },
    'footer-company': { total: 0, visible: 0, hidden: 0 },
    'footer-involved': { total: 0, visible: 0, hidden: 0 },
    'footer-legal': { total: 0, visible: 0, hidden: 0 },
    overall: { total: 0, visible: 0, hidden: 0 }
  };

  NAVIGATION_LINKS.forEach(link => {
    const section = link.section;
    const visible = isPageVisible(settings, link.id);

    stats[section].total++;
    stats.overall.total++;

    if (visible) {
      stats[section].visible++;
      stats.overall.visible++;
    } else {
      stats[section].hidden++;
      stats.overall.hidden++;
    }
  });

  return stats;
}
