import { useState } from "react";
import { CopyButton, Reveal, SectionHeading } from "../components/ui";

type Mode = "quick" | "full";

const copy = {
  quick: {
    index: "QUICK MODE",
    title: "The next prayer, at a glance.",
    body: "A compact live view of today’s five times, the next prayer, and its countdown. It does not take over the screen or clear your terminal scrollback.",
    list: ["Today’s five prayer times", "Live next-prayer countdown", "Qibla direction", "Plain output with --once, also when piped"],
    command: "salat",
    note: "Quick Mode stays intentionally compact: the essential prayer information, directly in your existing shell.",
  },
  full: {
    index: "FULL TUI",
    title: "Configuration without leaving the terminal.",
    body: "Navigate Today, Settings, Prayers, and Status from the keyboard. Configure per-prayer reminders, Adhan, location, and calculation options.",
    list: ["Four primary screens", "Per-prayer Adhan and notification controls", "Location and calculation settings", "Ten-component health status"],
    command: "salat --full",
    note: "The Status capture below shows one of the full TUI’s primary screens.",
  },
} as const;

export function Modes() {
  const [mode, setMode] = useState<Mode>("quick");
  const m = copy[mode];
  return (
    <section className="page-section modes-section" id="product">
      <Reveal>
        <SectionHeading
          eyebrow="01 / TWO MODES"
          title="An instant answer, or the full interface."
          copy="The bare command stays compact. The full flag opens every screen and configuration control."
        />
        <div className="mode-layout">
          <div className="mode-copy">
            <div className="segmented" role="tablist" aria-label="Salat modes">
              {(["quick", "full"] as const).map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => setMode(id)}
                  type="button"
                >
                  $ {copy[id].command}
                </button>
              ))}
            </div>
            <p className="mode-index">{m.index}</p>
            <h3>{m.title}</h3>
            <p>{m.body}</p>
            <ul className="terminal-list">
              {m.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mode-spec" aria-live="polite">
            <div className="mode-spec-command">
              <span>COMMAND</span>
              <div>
                <code>$ {m.command}</code>
                <CopyButton text={m.command} />
              </div>
            </div>
            <dl>
              {mode === "quick" ? (
                <>
                  <div><dt>OUTPUT</dt><dd>Compact live terminal view</dd></div>
                  <div><dt>SCROLLBACK</dt><dd>Preserved</dd></div>
                  <div><dt>INTERACTION</dt><dd>Focused summary</dd></div>
                  <div><dt>SCRIPTING</dt><dd>Use <code>salat --once</code></dd></div>
                </>
              ) : (
                <>
                  <div><dt>OUTPUT</dt><dd>Full-screen Ratatui interface</dd></div>
                  <div><dt>SCREENS</dt><dd>Today · Settings · Prayers · Status</dd></div>
                  <div><dt>INTERACTION</dt><dd>Keyboard-first navigation</dd></div>
                  <div><dt>EXIT</dt><dd><code>q</code> or <code>Ctrl-C</code></dd></div>
                </>
              )}
            </dl>
            <p>{m.note}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
