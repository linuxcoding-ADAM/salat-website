import { DOCS, GITHUB, ISSUES, LICENSE, RELEASES, VERSION } from "../content";

export function Footer() {
  return (
    <footer>
      <div>
        <a className="wordmark" href="#top">
          <span aria-hidden="true">◐</span> SALAT
        </a>
        <p>Prayer times and Adhan for the Linux terminal.</p>
      </div>
      <div className="footer-links">
        <a href={GITHUB} target="_blank" rel="noreferrer">GITHUB</a>
        <a href={DOCS} target="_blank" rel="noreferrer">DOCUMENTATION</a>
        <a href={RELEASES} target="_blank" rel="noreferrer">RELEASES</a>
        <a href={ISSUES} target="_blank" rel="noreferrer">ISSUES</a>
        <a href="#install">INSTALL</a>
        <a href={LICENSE} target="_blank" rel="noreferrer">LICENSE</a>
      </div>
      <p className="footer-meta">{VERSION} · MIT OR APACHE-2.0</p>
    </footer>
  );
}
