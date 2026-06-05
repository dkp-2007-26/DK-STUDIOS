import Hero from '../components/home/Hero';
import Services from '../components/home/Services';
import Portfolio from '../components/home/Portfolio';
import Testimonials from '../components/home/Testimonials';
import Delivery from '../components/home/Delivery';
import Contact from '../components/home/Contact';
import { type NavigateTo } from '../hooks/useRouter';

interface HomeProps {
  navigate: NavigateTo;
}

export default function Home({ navigate }: HomeProps) {
  return (
    <main>
      <Hero navigate={navigate} />
      <Services navigate={navigate} />
      <Portfolio navigate={navigate} />
      <Testimonials />
      <Delivery />
      <Contact />
    </main>
  );
}
