import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRouter } from './hooks/useRouter';
import { isAdminPage } from './app/router';
import AppRoutes from './app/AppRoutes';
import AppLoader from './components/app/AppLoader';
import PublicSiteLayout from './components/app/PublicSiteLayout';
import AuthModal from './components/auth/AuthModal';
import { setGlitchTipRoute, setGlitchTipUser } from './lib/glitchtip';

function AppContent() {
  const { page, navigate } = useRouter();
  const { loading, user } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'forgot' | null>(null);

  useEffect(() => {
    setGlitchTipRoute(page);
  }, [page]);

  useEffect(() => {
    if (!loading) {
      setGlitchTipUser(user
        ? {
            id: user.id,
            role: user.role,
            isAdmin: user.isAdmin,
            isDelivery: user.isDelivery,
          }
        : null);
    }
  }, [loading, user]);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {isAdminPage(page) ? (
        <AppRoutes page={page} navigate={navigate} onOpenAuth={(mode) => setAuthModal(mode)} />
      ) : (
        <PublicSiteLayout
          currentPage={page}
          navigate={navigate}
          onOpenAuth={(mode) => setAuthModal(mode)}
        >
          <AppRoutes page={page} navigate={navigate} onOpenAuth={(mode) => setAuthModal(mode)} />
        </PublicSiteLayout>
      )}

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={(mode) => setAuthModal(mode)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
