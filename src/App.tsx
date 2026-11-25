import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { Adhan } from "./sections/Adhan";
import { Architecture } from "./sections/Architecture";
import { Features } from "./sections/Features";
import { FullTui } from "./sections/FullTui";
import { Hero } from "./sections/Hero";
import { Install } from "./sections/Install";
import { Modes } from "./sections/Modes";
import { OpenSource } from "./sections/OpenSource";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <Modes />
        <Features />
        <FullTui />
        <Adhan />
        <Architecture />
        <Install />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
