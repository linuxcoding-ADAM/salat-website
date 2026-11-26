import { useEffect, useRef } from "react";

const CELL = 16; // px, including the gap
const GAP = 3;
const RADIUS = 78; // px around the cursor that lights up
const FADE_MS = 900; // time for a lit cell to disappear
// GitHub-contribution-graph style steps, from faint to bright (r, g, b, alpha).
const LEVELS: [number, number, number, number][] = [
  [74, 222, 128, 0.1],
  [74, 222, 128, 0.2],
  [74, 222, 128, 0.34],
  [74, 222, 128, 0.5],
];

type Cell = { x: number; y: number; level: number; t: number };

/**
 * Green squares that light up around the cursor and fade away, like the cells of a
 * contribution graph. Decorative only: it ignores pointer events, is hidden from
 * assistive technology, and is switched off for touch input and reduced motion.
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

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(window.innerHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function light(px: number, py: number) {
      const cols = Math.ceil(width / CELL) + 1;
      const c0 = Math.floor((px - RADIUS) / CELL);
      const c1 = Math.floor((px + RADIUS) / CELL);
      const r0 = Math.floor((py - RADIUS) / CELL);
      const r1 = Math.floor((py + RADIUS) / CELL);
      const now = performance.now();
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (c < 0 || r < 0) continue;
          const cx = c * CELL + CELL / 2;
          const cy = r * CELL + CELL / 2;
          const d = Math.hypot(cx - px, cy - py);
          if (d > RADIUS) continue;
          // Nearer cells are brighter; a little randomness gives the uneven graph look.
          const strength = (1 - d / RADIUS) * (0.55 + Math.random() * 0.45);
          const level = Math.min(LEVELS.length, Math.max(1, Math.ceil(strength * LEVELS.length)));
          const key = r * cols + c;
          const old = cells.get(key);
          if (!old || level >= old.level * (1 - (now - old.t) / FADE_MS)) {
            cells.set(key, { x: c * CELL, y: r * CELL, level, t: now });
          }
        }
      }
      if (!raf) raf = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      raf = 0;
      ctx!.clearRect(0, 0, width, window.innerHeight);
      for (const [key, cell] of cells) {
        const age = (now - cell.t) / FADE_MS;
        if (age >= 1) {
          cells.delete(key);
          continue;
        }
        const [r, g, b, a] = LEVELS[cell.level - 1];
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * (1 - age)})`;
        ctx!.fillRect(cell.x, cell.y, CELL - GAP, CELL - GAP);
      }
      if (cells.size) raf = requestAnimationFrame(draw);
    }

    const onMove = (e: PointerEvent) => light(e.clientX, e.clientY);
    const onLeave = () => cells.clear();

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="cursor-grid" aria-hidden="true" />;
}
