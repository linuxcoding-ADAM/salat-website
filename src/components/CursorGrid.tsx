import { useEffect, useRef } from "react";

const CELL = 12; // px, including the gap
const GAP = 2;
const RADIUS = 54; // px around the cursor that lights up
const SPARSE = 0.55; // share of cells in that area that never light (0 = all, 1 = none)
const FADE_MS = 1500; // time for a fully lit cell to disappear
const FOLLOW = 0.16; // how quickly the lit area catches up with the pointer (0..1 per frame)
// Contribution-graph greens, darkest to brightest.
const GREENS: [number, number, number][] = [
  [20, 83, 45],
  [22, 128, 60],
  [34, 175, 84],
  [74, 222, 128],
];

// The Salat mark (pixel crescent and star), one grid square per character:
// M = moon, S = star. It appears where the pointer comes to rest.
const LOGO = [
  "......S.",
  "..M..SSS",
  ".M....S.",
  "MM......",
  "MMM.....",
  "MMM.....",
  ".MMMMM..",
  "..MMM...",
];
const IDLE_MS = 450; // pointer stillness before the mark forms
const FORM_MS = 260; // how long one square takes to light up
const STAR: [number, number, number] = [226, 238, 232];

type Cell = {
  x: number;
  y: number;
  v: number;
  hold?: boolean; // part of the resting mark: stays lit until the pointer moves
  star?: boolean;
  delay?: number; // ms before this square starts to light up
  age?: number;
};

/** A stable pseudo-random number per cell, so a cell's brightness never flickers. */
function hash(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * Green squares that light up around the cursor and fade away, like the cells of a
 * contribution graph. It is drawn BEHIND the page content. Decorative only: it ignores
 * pointer events, is hidden from assistive technology, and is off for touch input and
 * reduced motion.
 */
export function CursorGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cells = new Map<number, Cell>();
    let raf = 0;
    let width = 0;
    let height = 0;
    let last = 0;
    let idleTimer = 0;
    let target: { x: number; y: number } | null = null; // where the pointer is
    let lit: { x: number; y: number } | null = null; // the smoothed point that lights cells

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function light(px: number, py: number) {
      const cols = Math.ceil(width / CELL) + 1;
      const c0 = Math.floor((px - RADIUS) / CELL);
      const c1 = Math.floor((px + RADIUS) / CELL);
      const r0 = Math.floor((py - RADIUS) / CELL);
      const r1 = Math.floor((py + RADIUS) / CELL);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (c < 0 || r < 0) continue;
          const d = Math.hypot(c * CELL + CELL / 2 - px, r * CELL + CELL / 2 - py);
          if (d > RADIUS) continue;
          const key = r * cols + c;
          if (hash(key + 7919) < SPARSE) continue; // keep the trail small and patchy
          // Near cells are brighter; a fixed per-cell factor gives the uneven graph look.
          const s = Math.pow(1 - d / RADIUS, 0.8) * (0.45 + 0.55 * hash(key));
          const cell = cells.get(key);
          if (cell) cell.v = Math.max(cell.v, cell.v + (s - cell.v) * 0.5);
          else cells.set(key, { x: c * CELL, y: r * CELL, v: s * 0.5 });
        }
      }
    }

    function release() {
      window.clearTimeout(idleTimer);
      for (const cell of cells.values()) {
        if (cell.hold) {
          cell.hold = false;
          cell.v = Math.min(cell.v, 1);
        }
      }
    }

    /** Light the Salat mark, centred on the pointer and snapped to the grid. */
    function formLogo() {
      if (!target) return;
      const cols = Math.ceil(width / CELL) + 1;
      const rows = LOGO.length;
      const w = LOGO[0].length;
      const c0 = Math.round(target.x / CELL - w / 2);
      const r0 = Math.round(target.y / CELL - rows / 2);
      LOGO.forEach((line, ry) =>
        [...line].forEach((ch, rx) => {
          if (ch === ".") return;
          const c = c0 + rx;
          const r = r0 + ry;
          if (c < 0 || r < 0 || c * CELL > width || r * CELL > height) return;
          const d = Math.hypot(rx - w / 2, ry - rows / 2);
          cells.set(r * cols + c, {
            x: c * CELL,
            y: r * CELL,
            v: 0,
            hold: true,
            star: ch === "S",
            delay: d * 40,
            age: 0,
          });
        }),
      );
      wake();
    }

    function frame(now: number) {
      raf = 0;
      const dt = Math.min(now - (last || now), 50);
      last = now;

      if (target) {
        if (!lit) lit = { ...target };
        // Ease toward the pointer, lighting cells along the way so a fast move leaves no gaps.
        const nx = lit.x + (target.x - lit.x) * FOLLOW;
        const ny = lit.y + (target.y - lit.y) * FOLLOW;
        const dist = Math.hypot(nx - lit.x, ny - lit.y);
        const steps = Math.max(1, Math.ceil(dist / (CELL / 2)));
        // Only a moving pointer lights squares; one that has come to rest lets them fade.
        if (dist > 0.3) {
          for (let i = 1; i <= steps; i++) {
            light(lit.x + ((nx - lit.x) * i) / steps, lit.y + ((ny - lit.y) * i) / steps);
          }
        }
        lit = { x: nx, y: ny };
      }

      ctx!.clearRect(0, 0, width, height);
      const fade = dt / FADE_MS;
      let forming = false;
      for (const [key, cell] of cells) {
        if (cell.hold) {
          cell.age = (cell.age ?? 0) + dt;
          const t = Math.max(0, (cell.age - (cell.delay ?? 0)) / FORM_MS);
          if (t < 1) forming = true;
          const v = Math.min(1, t);
          // Moon squares vary between the brighter greens, like a contribution graph; the star is pale.
          const tone = cell.star ? STAR : GREENS[2 + (hash(key + 31) > 0.5 ? 1 : 0)];
          ctx!.fillStyle = `rgba(${tone[0]}, ${tone[1]}, ${tone[2]}, ${v})`;
          ctx!.fillRect(cell.x, cell.y, CELL - GAP, CELL - GAP);
          continue;
        }
        cell.v -= fade;
        if (cell.v <= 0.01) {
          cells.delete(key);
          continue;
        }
        const v = Math.min(1, cell.v);
        const [r, g, b] = GREENS[Math.min(GREENS.length - 1, Math.floor(v * GREENS.length))];
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, 0.25 + v * 0.75)})`;
        ctx!.fillRect(cell.x, cell.y, CELL - GAP, CELL - GAP);
      }

      const settling = target && lit && Math.hypot(target.x - lit.x, target.y - lit.y) > 0.5;
      const decaying = [...cells.values()].some((c) => !c.hold);
      if (decaying || forming || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    }
    const onMove = (e: PointerEvent) => {
      target = { x: e.clientX, y: e.clientY };
      release();
      idleTimer = window.setTimeout(formLogo, IDLE_MS);
      wake();
    };
    const onLeave = () => {
      release();
      target = null;
      lit = null;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="cursor-grid" aria-hidden="true" />;
}
