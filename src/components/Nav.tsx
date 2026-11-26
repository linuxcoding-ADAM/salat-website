import { Logo } from "./Logo";
import { useState } from "react";
import { PixelHover } from "./PixelText";
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
        <a href="#product" onClick={close}><PixelHover text="PRODUCT" fixed /></a>
        <a href="#demo" onClick={close}><PixelHover text="DEMO" fixed /></a>
        <a href="#features" onClick={close}><PixelHover text="FEATURES" fixed /></a>
        <a href="#architecture" onClick={close}><PixelHover text="ARCHITECTURE" fixed /></a>
        <a href="#platforms" onClick={close}><PixelHover text="PLATFORMS" fixed /></a>
        <a href={GITHUB} target="_blank" rel="noreferrer"><PixelHover text="GITHUB ↗" fixed /></a>
        <a className="nav-cta" href="#install" onClick={close}>INSTALL</a>
      </div>
    </nav>
  );
}
