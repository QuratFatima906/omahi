import { Hero } from './components/hero';
import { Nav } from './components/nav';

export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <Nav />
      <Hero />
    </div>
  );
}
