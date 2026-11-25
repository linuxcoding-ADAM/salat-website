import { Reveal, SectionHeading } from "../components/ui";
import { flow, stack } from "../content";

export function Architecture() {
  return (
    <section className="page-section architecture-section" id="architecture">
      <Reveal>
        <SectionHeading
          eyebrow="05 / ARCHITECTURE"
          title="A local tool with explicit boundaries."
          copy="Remote prayer data enters once, is validated and cached, then feeds the scheduler and terminal views."
        />
        <div className="architecture-layout">
          <ol className="flow" aria-label="Salat data flow">
            {flow.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </li>
            ))}
          </ol>
          <div className="stack-table">
            <div className="stack-header">salat :: technical stack</div>
            {stack.map(([key, value, note]) => (
              <div className="stack-row" key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
