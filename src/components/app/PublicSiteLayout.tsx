import type { ReactNode } from 'react';
import type { Page } from '../../app/router';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import FloatingWhatsAppButton from './FloatingWhatsAppButton';

interface PublicSiteLayoutProps {
  currentPage: Page;
  navigate: (page: Page) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  children: ReactNode;
}

export default function PublicSiteLayout({
  currentPage,
  navigate,
  onOpenAuth,
  children,
}: PublicSiteLayoutProps) {
  return (
    <>
      <Navbar currentPage={currentPage} navigate={navigate} onOpenAuth={onOpenAuth} />
      <div>{children}</div>
      <Footer navigate={navigate} />
      <FloatingWhatsAppButton />
    </>
  );
}
