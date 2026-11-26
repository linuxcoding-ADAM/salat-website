import { Logo } from "./Logo";
import { useState } from "react";
import { GITHUB } from "../content";

export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <a className="wordmark" href="#top" aria-label="Salat home">
        <Logo size={22} /> SALAT
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "CLOSE" : "MENU"}
      </button>
      <div id="nav-links" className="nav-links" data-open={open}>
        <a href="#product" onClick={close}>PRODUCT</a>
        <a href="#demo" onClick={close}>DEMO</a>
        <a href="#features" onClick={close}>FEATURES</a>
        <a href="#architecture" onClick={close}>ARCHITECTURE</a>
        <a href="#platforms" onClick={close}>PLATFORMS</a>
        <a href={GITHUB} target="_blank" rel="noreferrer">GITHUB ↗</a>
        <a className="nav-cta" href="#install" onClick={close}>INSTALL</a>
      </div>
    </nav>
  );
}
