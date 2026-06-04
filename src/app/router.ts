export type Page =
  | 'home'
  | 'portfolio'
  | 'services'
  | 'templates'
  | 'dashboard'
  | 'order'
  | 'review'
  | 'admin-secure-login'
  | 'admin-dashboard'
  | 'delivery-secure-login'
  | 'delivery-scan';

export const VALID_PAGES: Page[] = [
  'home',
  'portfolio',
  'services',
  'templates',
  'dashboard',
  'order',
  'review',
  'admin-secure-login',
  'admin-dashboard',
  'delivery-secure-login',
  'delivery-scan',
];

export const PRIMARY_NAV_LINKS: Array<{ label: string; page: Page }> = [
  { label: 'Home', page: 'home' },
  { label: 'Services', page: 'services' },
  { label: 'Portfolio', page: 'portfolio' },
  { label: 'Templates', page: 'templates' },
];

export const FOOTER_QUICK_LINKS: Array<{ label: string; page: Page }> = [
  { label: 'Home', page: 'home' },
  { label: 'Services', page: 'services' },
  { label: 'Portfolio', page: 'portfolio' },
  { label: 'Templates', page: 'templates' },
  { label: 'Place Order', page: 'order' },
];

export function hashToPage(hash: string): Page {
  const normalizedHash = hash.replace('#', '').replace('/', '');
  return VALID_PAGES.includes(normalizedHash as Page) ? (normalizedHash as Page) : 'home';
}

export function isAdminPage(page: Page) {
  return page === 'admin-secure-login' || page === 'admin-dashboard' || page === 'delivery-secure-login' || page === 'delivery-scan';
}
