import status from "../assets/salat-status.png";
import { ProductScreenshot, Reveal, SectionHeading } from "../components/ui";

export function FullTui() {
  return (
    <section className="page-section tui-section">
      <Reveal>
        <SectionHeading
          eyebrow="03 / FULL TUI"
          title="System health, without false assurances."
          copy="The Status screen reports each subsystem independently, then shows the next scheduled event and today’s event totals."
        />
        <ProductScreenshot
          src={status}
          width={1366}
          height={671}
          alt="Salat Status screen in a Linux terminal, listing prayer service, calculation, location, timezone, notifications, Adhan sound, audio system, network, config file and prayer database, with the next Adhan event for Fajr and today's counters."
          caption="Status screen · Tamokra · recorded 09 Sep 2026"
          className="status-product-shot"
        />
      </Reveal>
    </section>
  );
}
