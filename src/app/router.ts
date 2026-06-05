export type Page =
  | 'home'
  | 'spotlight'
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
  'spotlight',
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
  { label: 'Spotlight', page: 'spotlight' },
  { label: 'Templates', page: 'templates' },
];

export const FOOTER_QUICK_LINKS: Array<{ label: string; page: Page }> = [
  { label: 'Home', page: 'home' },
  { label: 'Services', page: 'services' },
  { label: 'Spotlight', page: 'spotlight' },
  { label: 'Templates', page: 'templates' },
  { label: 'Place Order', page: 'order' },
];

export function routeToPage(value: string): Page {
  const normalized = value
    .replace(/^#/, '')
    .replace(/^\/+|\/+$/g, '')
    .split('?')[0]
    .split('#')[0];
  if (!normalized) return 'home';
  if (normalized === 'portfolio') return 'spotlight';
  return VALID_PAGES.includes(normalized as Page) ? (normalized as Page) : 'home';
}

export function currentRouteToPage(): Page {
  return routeToPage(window.location.hash || window.location.pathname);
}

export function pageToPath(page: Page) {
  return page === 'home' ? '/' : `/${page}`;
}

export function hashToPage(hash: string): Page {
  return routeToPage(hash);
}

export function isAdminPage(page: Page) {
  return page === 'admin-secure-login' || page === 'admin-dashboard' || page === 'delivery-secure-login' || page === 'delivery-scan';
}
