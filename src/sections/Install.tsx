import { CommandRow, Eyebrow, Reveal, TerminalChrome } from "../components/ui";
import { INSTALL_COMMAND } from "../content";

export function Install() {
  return (
    <section className="page-section install-section" id="install">
      <div className="atmosphere atmosphere-two" aria-hidden="true" />
      <Reveal className="install-layout">
        <div>
          <Eyebrow>07 / INSTALL</Eyebrow>
          <h2>One command. Then your terminal.</h2>
          <p>
            Run the installer, then launch Quick Mode with <code>salat</code> or the complete
            interface with <code>salat --full</code>. It installs the release binary into{" "}
            <code>~/.local/bin</code>.
          </p>
          <dl className="requirements" id="platforms">
            <div><dt>SUPPORTED</dt><dd>Linux on x86_64</dd></div>
            <div><dt>PLANNED</dt><dd>Linux on ARM64 (aarch64)</dd></div>
            <div><dt>UNSUPPORTED</dt><dd>Native Windows and macOS</dd></div>
            <div><dt>WSL2</dt><dd>Not officially supported</dd></div>
            <div><dt>NEEDS</dt><dd>curl or wget, tar, sha256sum or shasum</dd></div>
            <div><dt>OPTIONAL</dt><dd>An audio player for Adhan; a D-Bus session for notifications</dd></div>
          </dl>
        </div>
        <TerminalChrome title="install salat">
          <div className="install-terminal">
            <div className="install-terminal-label">
              <span>INSTALLER</span>
            </div>
            <CommandRow command={INSTALL_COMMAND} />
            <CommandRow command="salat" />
            <CommandRow command="salat --full" />
            <p>Review downloaded scripts before running them in your shell.</p>
          </div>
        </TerminalChrome>
      </Reveal>
    </section>
  );
}
