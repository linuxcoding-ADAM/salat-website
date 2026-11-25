import { Reveal, SectionHeading } from "../components/ui";
import { features } from "../content";

export function Features() {
  return (
    <section className="page-section features-section" id="features">
      <Reveal>
        <SectionHeading
          eyebrow="02 / CAPABILITIES"
          title={<>Designed to be quiet.<br />Ready when it matters.</>}
          copy="Salat focuses on a small, dependable set of terminal-native jobs."
        />
        <div className="feature-ledger">
          {features.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
