import { lazy, Suspense } from "react";
import { Reveal, SectionHeading } from "../components/ui";

// The simulation is large, so it loads on its own and never delays the first screen.
const SalatTUI = lazy(() => import("../SalatTUI"));

export function Demo() {
  return (
    <section className="page-section interactive-section" id="demo">
      <Reveal>
        <SectionHeading
          eyebrow="04 / INTERACTIVE TERMINAL"
          title="Explore Salat from the keyboard."
          copy="This is an interactive browser simulation of the Salat interface. It uses representative sample data and does not run the Rust binary or fetch live prayer times."
        />
        <div className="demo-instructions">
          <span><b>1–4</b> primary screens</span>
          <span><b>↑↓</b> move</span>
          <span><b>ENTER</b> select</span>
          <span><b>ESC</b> back</span>
        </div>
        <div className="interactive-shell">
          <div className="interactive-shell-bar">
            <span><i /> INTERACTIVE PREVIEW · SIMULATION, SAMPLE DATA</span>
            <span>CLICK OR TAB INTO THE TERMINAL TO ENABLE SHORTCUTS</span>
          </div>
          <div className="interactive-scroll">
            <Suspense fallback={<p className="demo-loading">Loading the simulation…</p>}>
              <SalatTUI />
            </Suspense>
          </div>
        </div>
        <p className="demo-mobile-hint">
          On narrow screens, scroll the terminal horizontally or select the 80×24 terminal size.
        </p>
      </Reveal>
    </section>
  );
}
