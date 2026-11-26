import type { CSSProperties } from "react";

/** Splits text into words of per-character spans; the caller decides what each character does. */
function chars(text: string, className: string) {
  let index = 0;
  return text.split(" ").map((word, w, words) => (
    <span key={w} aria-hidden="true">
      <span className="px-word">
        {[...word].map((ch) => {
          const i = index++;
          return (
            <span className={className} key={i} style={{ ["--i" as string]: i } as CSSProperties}>
              {ch}
            </span>
          );
        })}
      </span>
      {w < words.length - 1 ? " " : null}
    </span>
  ));
}

/**
 * Text that loops forever, character by character, between the pixel font and the normal
 * font. The colour is set by the parent and never changes. Plain text for assistive technology.
 */
export function PixelLoop({ text }: { text: string }) {
  return (
    <span className="pixel-loop" aria-label={text}>
      {chars(text, "px-loop-ch")}
    </span>
  );
}

/**
 * Text that, when hovered, turns green and then morphs quickly, character by character, into
 * the pixel font. `fixed` keeps every character in a box of constant width so that a row of
 * links does not shift while the font changes. Plain text for assistive technology.
 */
export function PixelHover({ text, fixed = false }: { text: string; fixed?: boolean }) {
  return (
    <span className={fixed ? "pixel-hover pixel-hover-fixed" : "pixel-hover"} aria-label={text}>
      {chars(text, "px-hover-ch")}
    </span>
  );
}
