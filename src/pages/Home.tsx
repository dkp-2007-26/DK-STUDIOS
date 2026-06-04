import Hero from '../components/home/Hero';
import Services from '../components/home/Services';
import Portfolio from '../components/home/Portfolio';
import Templates from '../components/home/Templates';
import Testimonials from '../components/home/Testimonials';
import Delivery from '../components/home/Delivery';
import Contact from '../components/home/Contact';
import { Page } from '../hooks/useRouter';

interface HomeProps {
  navigate: (page: Page) => void;
}

export default function Home({ navigate }: HomeProps) {
  return (
    <main>
      <Hero navigate={navigate} />
      <Services navigate={navigate} />
      <Portfolio navigate={navigate} />
      <Templates navigate={navigate} />
      <Testimonials />
      <Delivery />
      <Contact />
    </main>
  );
}
