import { useEffect, useState, type CSSProperties } from "react";

/** Splits text into words of per-character spans; the caller decides what each character does. */
function chars(text: string, className: (i: number) => string) {
  let index = 0;
  return text.split(" ").map((word, w, words) => (
    <span key={w} aria-hidden="true">
      <span className="px-word">
        {[...word].map((ch) => {
          const i = index++;
          return (
            <span className={className(i)} key={i} style={{ ["--i" as string]: i } as CSSProperties}>
              {ch}
            </span>
          );
        })}
      </span>
      {w < words.length - 1 ? " " : null}
    </span>
  ));
}

const STEP_MS = 90; // delay between one character turning pixel and the next
const HOLD_MS = 4200; // the whole phrase stays pixelated this long
const REST_MS = 900; // the whole phrase stays in the normal font this long before it restarts

/**
 * Text that loops forever: the characters turn into the pixel font one after another, the
 * whole phrase stays pixelated for a while, then it goes back to the normal font and starts
 * over. The colour is set by the parent and never changes. Plain text for assistive technology.
 */
export function PixelLoop({ text }: { text: string }) {
  const total = [...text].filter((ch) => ch !== " ").length;
  const [count, setCount] = useState(0); // how many characters are pixelated right now

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let n = 0;
    const tick = () => {
      if (n < total) {
        n += 1;
        setCount(n);
        // Once the last character is pixelated, wait before going back to the start.
        timer = window.setTimeout(tick, n === total ? HOLD_MS : STEP_MS);
      } else {
        n = 0;
        setCount(0);
        timer = window.setTimeout(tick, REST_MS);
      }
    };
    timer = window.setTimeout(tick, REST_MS);
    return () => window.clearTimeout(timer);
  }, [total]);

  return (
    <span className="pixel-loop" aria-label={text}>
      {chars(text, (i) => (i < count ? "px-loop-ch is-pixel" : "px-loop-ch"))}
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
      {chars(text, () => "px-hover-ch")}
    </span>
  );
}
