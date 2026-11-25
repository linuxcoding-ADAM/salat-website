import { useEffect, useRef, useState, type ReactNode } from "react";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      element.dataset.visible = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export function CopyButton({ text, label = "COPY" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button
      className="copy-button"
      data-state={state}
      onClick={copy}
      type="button"
      aria-live="polite"
      aria-label={
        state === "copied"
          ? "Command copied"
          : state === "failed"
            ? "Copy failed. Try copying the command manually"
            : `Copy command: ${text}`
      }
    >
      {state === "copied" ? "✓ COPIED!" : state === "failed" ? "COPY FAILED" : `[ ${label} ]`}
    </button>
  );
}

export function CommandRow({ command }: { command: string }) {
  return (
    <div className="command-row">
      <code>
        <span aria-hidden="true">$</span> {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true">●</span>
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: ReactNode;
  copy?: ReactNode;
}) {
  return (
    <header className="section-heading">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  );
}

export function TerminalChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="terminal-window">
      <div className="terminal-chrome">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <span aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

export function ProductScreenshot({
  src,
  alt,
  caption,
  width,
  height,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
}) {
  return (
    <figure className={`product-shot ${className}`}>
      <div className="product-shot-frame">
        {/* The scroll area is focusable so keyboard users can pan the wide capture on small screens. */}
        <div className="asset-scroll" tabIndex={0} role="group" aria-label="Screenshot, scrollable">
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
          />
        </div>
      </div>
      <figcaption>
        <span aria-hidden="true">↳</span> {caption}
      </figcaption>
    </figure>
  );
}
