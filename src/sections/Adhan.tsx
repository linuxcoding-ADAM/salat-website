import { Eyebrow, Reveal } from "../components/ui";

const facts = [
  ["01", "Per-prayer control", "Enable or disable Adhan playback independently for each prayer."],
  ["02", "Local audio", "Uses your configured file and the first available player among mpv, paplay, ffplay and aplay."],
  ["03", "Visible health", "Missing audio is reported as a degraded state instead of silently appearing ready."],
] as const;

export function Adhan() {
  return (
    <section className="page-section adhan-section">
      <Reveal className="adhan-layout">
        <div>
          <Eyebrow>04 / AT PRAYER TIME</Eyebrow>
          <h2>A clear state change. Nothing ambiguous.</h2>
          <p>
            When a configured event fires, Salat presents a distinct Adhan state and starts your
            local audio player if an audio file is configured. Salat ships without recitation
            audio: you provide the file.
          </p>
        </div>
        <div className="adhan-facts">
          {facts.map(([n, title, body]) => (
            <div key={n}>
              <span>{n}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
