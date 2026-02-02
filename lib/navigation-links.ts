/**
 * Navigation Links Registry
 *
 * Central registry of all navigation links across the Wingside application.
 * Used by Header, Footer, and Admin settings to manage page visibility.
 */

export interface NavigationLink {
  id: string;              // Unique identifier (e.g., "wingclub")
  label: string;           // Display name (e.g., "Wingclub")
  href: string;            // Route path (e.g., "/wingclub")
  section: 'header' | 'footer-company' | 'footer-involved' | 'footer-legal';
  description?: string;    // For admin UI tooltip
  alwaysVisible?: boolean; // Lock from hiding (e.g., Terms, Privacy for legal compliance)
}

/**
 * Complete registry of all navigation links
 * Total: 23 configurable links across 4 sections
 */
export const NAVIGATION_LINKS: NavigationLink[] = [
  // ============================================
  // HEADER SIDEBAR MENU (7 links)
  // ============================================
  {
    id: 'wingclub',
    label: 'Wingclub',
    href: '/wingclub',
    section: 'header',
    description: 'Loyalty program and rewards'
  },
  {
    id: 'business',
    label: 'Wingside Business',
    href: '/business',
    section: 'header',
    description: 'Corporate catering and business services'
  },
  {
    id: 'wingcafe',
    label: 'Wingcafé',
    href: '/wingcafe',
    section: 'header',
    description: 'Coffee and beverage offerings'
  },
  {
    id: 'gifts',
    label: 'Wingside Gifts',
    href: '/gifts',
    section: 'header',
    description: 'Gift cards and merchandise'
  },
  {
    id: 'connect',
    label: 'Wingside Connect',
    href: '/connect',
    section: 'header',
    description: 'Community and social features'
  },
  {
    id: 'kids',
    label: 'Wingside Kids',
    href: '/kids',
    section: 'header',
    description: 'Kids menu and family offerings'
  },
  {
    id: 'sports',
    label: 'Wingside Sports',
    href: '/sports',
    section: 'header',
    description: 'Sports events and game day specials'
  },

  // ============================================
  // FOOTER - COMPANY SECTION (8 links)
  // ============================================
  {
    id: 'about',
    label: 'About Us',
    href: '/about',
    section: 'footer-company',
    description: 'Company information and story'
  },
  {
    id: 'hotspots',
    label: 'Wingside Hotspots',
    href: '/hotspots',
    section: 'footer-company',
    description: 'Featured locations and programs'
  },
  {
    id: 'wingside_to_go',
    label: 'Wingside To-Go',
    href: '/wingside-to-go',
    section: 'footer-company',
    description: 'Takeout and delivery services'
  },
  {
    id: 'support',
    label: 'Support',
    href: '/support',
    section: 'footer-company',
    description: 'Customer support and help'
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '/blog',
    section: 'footer-company',
    description: 'News, recipes, and updates'
  },
  {
    id: 'flavors',
    label: 'Flavors',
    href: '/flavors',
    section: 'footer-company',
    description: 'Wing flavor catalog'
  },
  {
    id: 'gift_balance',
    label: 'Gift Card Balance',
    href: '/gift-balance',
    section: 'footer-company',
    description: 'Check gift card balance'
  },
  {
    id: 'contact',
    label: 'Contact Us',
    href: '/contact',
    section: 'footer-company',
    description: 'Contact form and information'
  },

  // ============================================
  // FOOTER - GET INVOLVED SECTION (4 links)
  // ============================================
  {
    id: 'careers',
    label: 'Careers',
    href: '/careers',
    section: 'footer-involved',
    description: 'Job openings and applications'
  },
  {
    id: 'franchising',
    label: 'Franchising',
    href: '/franchising',
    section: 'footer-involved',
    description: 'Franchise opportunities'
  },
  {
    id: 'wingside_cares',
    label: 'Wingside Cares',
    href: '/wingside-cares',
    section: 'footer-involved',
    description: 'Community involvement and charity'
  },
  {
    id: 'partnership',
    label: 'Partnership',
    href: '/partnership',
    section: 'footer-involved',
    description: 'Business partnership opportunities'
  },

  // ============================================
  // FOOTER - LEGAL SECTION (3 links)
  // ============================================
  {
    id: 'cookie_preferences',
    label: 'Cookie Preferences',
    href: '/cookie-preferences',
    section: 'footer-legal',
    description: 'Manage cookie settings'
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    href: '/terms',
    section: 'footer-legal',
    description: 'Terms of service',
    alwaysVisible: true // Legal compliance - cannot be hidden
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    href: '/privacy',
    section: 'footer-legal',
    description: 'Privacy policy',
    alwaysVisible: true // Legal compliance - cannot be hidden
  },
];

/**
 * Get all links for a specific section
 */
export function getLinksBySection(section: NavigationLink['section']): NavigationLink[] {
  return NAVIGATION_LINKS.filter(link => link.section === section);
}

/**
 * Get a link by its ID
 */
export function getLinkById(id: string): NavigationLink | undefined {
  return NAVIGATION_LINKS.find(link => link.id === id);
}

/**
 * Get all section names
 */
export function getAllSections(): NavigationLink['section'][] {
  return ['header', 'footer-company', 'footer-involved', 'footer-legal'];
}
