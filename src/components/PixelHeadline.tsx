/**
 * Headline text that appears letter by letter in the pixel font, in green, as if it were
 * being generated, and then turns white. Plain, readable text for assistive technology.
 */
export function PixelHeadline({ text }: { text: string }) {
  let index = 0;
  return (
    <span className="pixel-headline" aria-label={text}>
      {text.split(" ").map((word, w, words) => (
        <span key={w} aria-hidden="true">
          <span className="pixel-word">
          {[...word].map((ch) => {
            // A fixed, scattered order, so every visit looks the same and it never flickers on re-render.
            const i = index++;
            const delay = ((i * 37) % 11) * 70 + 150;
            return (
              <span className="pixel-char" key={i} style={{ ["--d" as string]: `${delay}ms` }}>
                {ch}
              </span>
            );
          })}
          </span>
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
