/**
 * Role-Based Access Control (RBAC) System
 *
 * This file defines all permissions for staff roles.
 * To adjust permissions, simply modify the rolePermissions object below.
 */

// Available user roles
export type UserRole =
  | 'customer'
  | 'admin' // Legacy role (backward compatibility)
  | 'super_admin'
  | 'csr'
  | 'kitchen_staff'
  | 'shift_manager'
  | 'delivery'
  | 'sales_marketing';

// Permission categories
export type PermissionCategory =
  | 'dashboard'
  | 'analytics'
  | 'orders'
  | 'products'
  | 'categories'
  | 'flavors'
  | 'delivery_areas'
  | 'promo_codes'
  | 'customers'
  | 'gift_cards'
  | 'wingside_cards'
  | 'wallet_transactions'
  | 'emergency_refund'
  | 'referrals'
  | 'crm_analytics'
  | 'events'
  | 'blog'
  | 'sports_events'
  | 'notifications'
  | 'job_positions'
  | 'job_applications'
  | 'stores'
  | 'wingpost_locations'
  | 'contact_submissions'
  | 'social_verifications'
  | 'hero_slides'
  | 'users'
  | 'settings'
  | 'maintenance'
  | 'role_management';

// Permission levels
export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

// Permission structure
export interface Permission {
  level: PermissionLevel;
  description?: string;
}

export interface RolePermissions {
  [key: string]: Permission;
}

/**
 * 🔐 ROLE PERMISSIONS MATRIX
 *
 * Edit this object to change what each role can access.
 *
 * Permission levels:
 * - 'none': No access at all (page won't show in nav, direct access blocked)
 * - 'view': Read-only access
 * - 'edit': Can view and modify
 * - 'full': Complete control (view, edit, delete, special actions)
 */
export const rolePermissions: Record<UserRole, RolePermissions> = {
  // CUSTOMER - Regular website users
  customer: {
    dashboard: { level: 'none' },
    analytics: { level: 'none' },
    orders: { level: 'none' },
    products: { level: 'none' },
    categories: { level: 'none' },
    flavors: { level: 'none' },
    delivery_areas: { level: 'none' },
    promo_codes: { level: 'none' },
    customers: { level: 'none' },
    gift_cards: { level: 'none' },
    wingside_cards: { level: 'none' },
    wallet_transactions: { level: 'none' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'none' },
    crm_analytics: { level: 'none' },
    events: { level: 'none' },
    blog: { level: 'none' },
    sports_events: { level: 'none' },
    notifications: { level: 'none' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'none' },
    wingpost_locations: { level: 'none' },
    contact_submissions: { level: 'none' },
    social_verifications: { level: 'none' },
    hero_slides: { level: 'none' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },

  // ADMIN (Legacy) - Full system access (backward compatibility)
  admin: {
    dashboard: { level: 'full' },
    analytics: { level: 'full' },
    orders: { level: 'full' },
    products: { level: 'full' },
    categories: { level: 'full' },
    flavors: { level: 'full' },
    delivery_areas: { level: 'full' },
    promo_codes: { level: 'full' },
    customers: { level: 'full' },
    gift_cards: { level: 'full' },
    wingside_cards: { level: 'full' },
    wallet_transactions: { level: 'full' },
    emergency_refund: { level: 'full' },
    referrals: { level: 'full' },
    crm_analytics: { level: 'full' },
    events: { level: 'full' },
    blog: { level: 'full' },
    sports_events: { level: 'full' },
    notifications: { level: 'full' },
    job_positions: { level: 'full' },
    job_applications: { level: 'full' },
    stores: { level: 'full' },
    wingpost_locations: { level: 'full' },
    contact_submissions: { level: 'full' },
    social_verifications: { level: 'full' },
    hero_slides: { level: 'full' },
    users: { level: 'full' },
    settings: { level: 'full' },
    maintenance: { level: 'full' },
    role_management: { level: 'full' },
  },

  // SUPER ADMIN - Full system access
  super_admin: {
    dashboard: { level: 'full' },
    analytics: { level: 'full' },
    orders: { level: 'full' },
    products: { level: 'full' },
    categories: { level: 'full' },
    flavors: { level: 'full' },
    delivery_areas: { level: 'full' },
    promo_codes: { level: 'full' },
    customers: { level: 'full' },
    gift_cards: { level: 'full' },
    wingside_cards: { level: 'full' },
    wallet_transactions: { level: 'full' },
    emergency_refund: { level: 'full' },
    referrals: { level: 'full' },
    crm_analytics: { level: 'full' },
    events: { level: 'full' },
    blog: { level: 'full' },
    sports_events: { level: 'full' },
    notifications: { level: 'full' },
    job_positions: { level: 'full' },
    job_applications: { level: 'full' },
    stores: { level: 'full' },
    wingpost_locations: { level: 'full' },
    contact_submissions: { level: 'full' },
    social_verifications: { level: 'full' },
    hero_slides: { level: 'full' },
    users: { level: 'full' },
    settings: { level: 'full' },
    maintenance: { level: 'full' },
    role_management: { level: 'full' },
  },

  // CSR - Customer Service Representative
  csr: {
    dashboard: { level: 'view', description: 'Overview only' },
    analytics: { level: 'none' },
    orders: { level: 'edit', description: 'View and update order status' },
    products: { level: 'view', description: 'View menu items for customer support' },
    categories: { level: 'none' },
    flavors: { level: 'none' },
    delivery_areas: { level: 'view' },
    promo_codes: { level: 'view', description: 'Validate codes for customers' },
    customers: { level: 'edit', description: 'View and assist customers' },
    gift_cards: { level: 'edit', description: 'Help customers with gift cards' },
    wingside_cards: { level: 'edit' },
    wallet_transactions: { level: 'edit', description: 'Help with wallet issues' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'view' },
    crm_analytics: { level: 'none' },
    events: { level: 'view' },
    blog: { level: 'none' },
    sports_events: { level: 'view' },
    notifications: { level: 'edit', description: 'Send customer notifications' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'view' },
    wingpost_locations: { level: 'view' },
    contact_submissions: { level: 'edit', description: 'Respond to customer inquiries' },
    social_verifications: { level: 'edit', description: 'Verify social media rewards' },
    hero_slides: { level: 'none' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },

  // KITCHEN STAFF - Kitchen operations only
  kitchen_staff: {
    dashboard: { level: 'view', description: 'Orders overview' },
    analytics: { level: 'none' },
    orders: { level: 'edit', description: 'Update order status (preparing/ready)' },
    products: { level: 'view', description: 'See menu items' },
    categories: { level: 'none' },
    flavors: { level: 'view', description: 'See available flavors' },
    delivery_areas: { level: 'none' },
    promo_codes: { level: 'none' },
    customers: { level: 'none' },
    gift_cards: { level: 'none' },
    wingside_cards: { level: 'none' },
    wallet_transactions: { level: 'none' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'none' },
    crm_analytics: { level: 'none' },
    events: { level: 'none' },
    blog: { level: 'none' },
    sports_events: { level: 'none' },
    notifications: { level: 'none' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'none' },
    wingpost_locations: { level: 'none' },
    contact_submissions: { level: 'none' },
    social_verifications: { level: 'none' },
    hero_slides: { level: 'none' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },

  // SHIFT MANAGER - Operations management
  shift_manager: {
    dashboard: { level: 'full' },
    analytics: { level: 'view', description: 'Operations metrics' },
    orders: { level: 'full', description: 'Full order management' },
    products: { level: 'full', description: 'Manage inventory' },
    categories: { level: 'edit' },
    flavors: { level: 'edit' },
    delivery_areas: { level: 'edit' },
    promo_codes: { level: 'edit', description: 'Create and manage promo codes' },
    customers: { level: 'edit' },
    gift_cards: { level: 'edit' },
    wingside_cards: { level: 'edit' },
    wallet_transactions: { level: 'view' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'view' },
    crm_analytics: { level: 'view' },
    events: { level: 'view' },
    blog: { level: 'none' },
    sports_events: { level: 'view' },
    notifications: { level: 'edit' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'edit' },
    wingpost_locations: { level: 'edit' },
    contact_submissions: { level: 'view' },
    social_verifications: { level: 'edit' },
    hero_slides: { level: 'none' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },

  // DELIVERY - Delivery operations
  delivery: {
    dashboard: { level: 'view', description: 'Delivery overview' },
    analytics: { level: 'none' },
    orders: { level: 'edit', description: 'Update delivery status' },
    products: { level: 'none' },
    categories: { level: 'none' },
    flavors: { level: 'none' },
    delivery_areas: { level: 'view' },
    promo_codes: { level: 'none' },
    customers: { level: 'view', description: 'See customer contact info for delivery' },
    gift_cards: { level: 'none' },
    wingside_cards: { level: 'none' },
    wallet_transactions: { level: 'none' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'none' },
    crm_analytics: { level: 'none' },
    events: { level: 'none' },
    blog: { level: 'none' },
    sports_events: { level: 'none' },
    notifications: { level: 'none' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'view' },
    wingpost_locations: { level: 'view' },
    contact_submissions: { level: 'none' },
    social_verifications: { level: 'none' },
    hero_slides: { level: 'none' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },

  // SALES & MARKETING - Marketing and promotions
  sales_marketing: {
    dashboard: { level: 'view' },
    analytics: { level: 'full', description: 'Full analytics access' },
    orders: { level: 'view', description: 'View for sales insights' },
    products: { level: 'view' },
    categories: { level: 'none' },
    flavors: { level: 'none' },
    delivery_areas: { level: 'none' },
    promo_codes: { level: 'full', description: 'Create marketing campaigns' },
    customers: { level: 'view', description: 'Customer insights for marketing' },
    gift_cards: { level: 'full', description: 'Gift card campaigns' },
    wingside_cards: { level: 'view' },
    wallet_transactions: { level: 'none' },
    emergency_refund: { level: 'none' },
    referrals: { level: 'full', description: 'Manage referral program' },
    crm_analytics: { level: 'full' },
    events: { level: 'full', description: 'Create and manage events' },
    blog: { level: 'full', description: 'Manage blog content' },
    sports_events: { level: 'full' },
    notifications: { level: 'full', description: 'Send marketing notifications' },
    job_positions: { level: 'none' },
    job_applications: { level: 'none' },
    stores: { level: 'view' },
    wingpost_locations: { level: 'view' },
    contact_submissions: { level: 'view' },
    social_verifications: { level: 'view' },
    hero_slides: { level: 'edit', description: 'Manage homepage content' },
    users: { level: 'none' },
    settings: { level: 'none' },
    maintenance: { level: 'none' },
    role_management: { level: 'none' },
  },
};

/**
 * Check if a user has permission to access a feature
 */
export function hasPermission(
  userRole: UserRole,
  category: PermissionCategory,
  requiredLevel: PermissionLevel = 'view'
): boolean {
  const permission = rolePermissions[userRole]?.[category];
  if (!permission) return false;

  const levels: PermissionLevel[] = ['none', 'view', 'edit', 'full'];
  const userLevelIndex = levels.indexOf(permission.level);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
}

/**
 * Get user's permission level for a category
 */
export function getPermissionLevel(
  userRole: UserRole,
  category: PermissionCategory
): PermissionLevel {
  return rolePermissions[userRole]?.[category]?.level || 'none';
}

/**
 * Check if user can access admin panel at all
 */
export function canAccessAdmin(userRole: UserRole): boolean {
  return userRole !== 'customer';
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    customer: 'Customer',
    admin: 'Admin',
    super_admin: 'Super Admin', // Backward compatibility only
    csr: 'Customer Service',
    kitchen_staff: 'Kitchen Staff',
    shift_manager: 'Shift Manager',
    delivery: 'Delivery',
    sales_marketing: 'Sales & Marketing',
  };
  return roleNames[role] || role;
}

/**
 * Get all staff roles (excludes customer)
 */
export function getStaffRoles(): UserRole[] {
  return ['admin', 'csr', 'kitchen_staff', 'shift_manager', 'delivery', 'sales_marketing'];
}
