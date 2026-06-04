import { useState, useEffect } from 'react';
import { hashToPage, type Page } from '../app/router';
export type { Page } from '../app/router';

export function useRouter() {
  const [page, setPage] = useState<Page>(() => hashToPage(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setPage(hashToPage(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (to: Page) => {
    window.location.hash = to;
  };

  return { page, navigate };
}
