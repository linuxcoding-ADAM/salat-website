import { Eyebrow, Reveal } from "../components/ui";
import { CONTRIBUTING, DOCS, GITHUB, GITLAB, ISSUES, RELEASES, VERSION } from "../content";

const links = [
  ["PRIMARY REPOSITORY", "GitHub / linuxcoding-ADAM/Salat", GITHUB],
  ["LATEST RELEASE", `Releases · ${VERSION}`, RELEASES],
  ["DOCUMENTATION", "Install, configuration, troubleshooting, known issues", DOCS],
  ["ISSUES", "Report a bug or suggest a feature", ISSUES],
  ["CONTRIBUTING", "How to send a pull request", CONTRIBUTING],
  ["CI MIRROR", "GitLab / linuxcoding-ADAM/salat", GITLAB],
] as const;

export function OpenSource() {
  return (
    <section className="page-section open-source-section">
      <Reveal>
        <Eyebrow>07 / OPEN SOURCE</Eyebrow>
        <h2>Built in the open.<br />Inspectable by default.</h2>
        <p>
          Read the implementation, report a problem, or contribute a fix. Salat is dual-licensed
          under MIT or Apache-2.0.
        </p>
        <div className="repository-links">
          {links.map(([label, title, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer">
              <span>{label}</span>
              <strong>{title}</strong>
              <em>OPEN ↗</em>
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
