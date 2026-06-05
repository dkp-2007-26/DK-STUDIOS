import { useState, useEffect } from 'react';
import { currentRouteToPage, pageToPath, type Page } from '../app/router';
export type { Page } from '../app/router';

export function useRouter() {
  const [page, setPage] = useState<Page>(() => currentRouteToPage());

  useEffect(() => {
    const updateFromRoute = () => setPage(currentRouteToPage());
    const onLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="/"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.origin !== window.location.origin) return;
      event.preventDefault();
      window.history.pushState(null, '', anchor.pathname + anchor.search + anchor.hash);
      updateFromRoute();
    };
    window.addEventListener('hashchange', updateFromRoute);
    window.addEventListener('popstate', updateFromRoute);
    document.addEventListener('click', onLinkClick);
    updateFromRoute();
    return () => {
      window.removeEventListener('hashchange', updateFromRoute);
      window.removeEventListener('popstate', updateFromRoute);
      document.removeEventListener('click', onLinkClick);
    };
  }, []);

  const navigate = (to: Page) => {
    window.history.pushState(null, '', pageToPath(to));
    setPage(to);
  };

  return { page, navigate };
}
