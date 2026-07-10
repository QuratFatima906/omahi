import { ClosingCta } from './components/closing-cta';
import { Faq } from './components/faq';
import { Features } from './components/features';
import { Footer } from './components/footer';
import { Hero } from './components/hero';
import { Nav } from './components/nav';
import { PhaseCards } from './components/phase-cards';

export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <Nav />
      <Hero />
      <PhaseCards />
      <Features />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
