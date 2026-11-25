import dashboard from "../assets/salat-dashboard.png";
import { CopyButton, Eyebrow, ProductScreenshot, Reveal } from "../components/ui";
import { GITHUB, INSTALL_COMMAND, VERSION } from "../content";

export function Hero() {
  return (
    <section className="hero page-section" id="top">
      <div className="atmosphere atmosphere-one" aria-hidden="true" />
      <Reveal className="hero-copy">
        <Eyebrow>RUST · RATATUI · LINUX</Eyebrow>
        <h1>
          Prayer times.
          <span>In your terminal.</span>
        </h1>
        <p className="hero-lede">
          A keyboard-first prayer-time assistant for Linux. See the next prayer, run a full
          interactive TUI, and schedule desktop reminders and Adhan playback without opening a
          browser.
        </p>
        <div className="button-row">
          <a className="button primary" href="#install">INSTALL SALAT</a>
          <a className="button secondary" href={GITHUB} target="_blank" rel="noreferrer">
            VIEW SOURCE ↗
          </a>
        </div>
        <div className="hero-install" role="group" aria-label="Installation command">
          <span aria-hidden="true">$</span>
          <code>{INSTALL_COMMAND}</code>
          <CopyButton text={INSTALL_COMMAND} />
        </div>
        <div className="release-line">
          <span>RELEASE {VERSION}</span>
          <span>x86_64 LINUX</span>
          <span>MIT OR APACHE-2.0</span>
        </div>
      </Reveal>
      <Reveal className="hero-terminal-wrap">
        <div className="preview-badge">ACTUAL SALAT CAPTURE · {VERSION}</div>
        <ProductScreenshot
          src={dashboard}
          width={1365}
          height={668}
          alt="Salat Today dashboard in a Linux terminal, showing Asr as the next prayer at 16:15, a countdown, today's prayer schedule, notification timing, Qibla direction, and service indicators."
          caption="Today dashboard · Tamokra, Béjaïa · recorded 08 Sep 2026"
          className="hero-product-shot"
          eager
        />
      </Reveal>
    </section>
  );
}
