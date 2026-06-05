import type { Page } from './router';
import Home from '../pages/Home';
import ServicesPage from '../pages/ServicesPage';
import PortfolioPage from '../pages/PortfolioPage';
import TemplatesPage from '../pages/TemplatesPage';
import DashboardPage from '../pages/DashboardPage';
import OrderExperiencePage from '../pages/OrderExperiencePage';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminOperationsPage from '../pages/AdminOperationsPage';
import DeliveryLoginPage from '../pages/DeliveryLoginPage';
import DeliveryScanPage from '../pages/DeliveryScanPage';
import ReviewPage from '../pages/ReviewPage';

interface AppRoutesProps {
  page: Page;
  navigate: (page: Page) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export default function AppRoutes({ page, navigate, onOpenAuth }: AppRoutesProps) {
  switch (page) {
    case 'services':
      return <ServicesPage navigate={navigate} />;
    case 'spotlight':
    case 'portfolio':
      return <PortfolioPage navigate={navigate} />;
    case 'templates':
      return <TemplatesPage navigate={navigate} />;
    case 'dashboard':
      return <DashboardPage navigate={navigate} />;
    case 'order':
      return <OrderExperiencePage navigate={navigate} onOpenAuth={onOpenAuth} />;
    case 'review':
      return <ReviewPage navigate={navigate} />;
    case 'admin-secure-login':
      return <AdminLoginPage navigate={navigate} />;
    case 'admin-dashboard':
      return <AdminOperationsPage navigate={navigate} />;
    case 'delivery-secure-login':
      return <DeliveryLoginPage navigate={navigate} />;
    case 'delivery-scan':
      return <DeliveryScanPage navigate={navigate} />;
    case 'home':
    default:
      return <Home navigate={navigate} />;
  }
}
