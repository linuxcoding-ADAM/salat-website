import { Fragment, useState, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

export const C = {
  termBg:     "#080d18",
  panelBg:    "#0b1222",
  rowActive:  "#0f1f36",
  rowSel:     "#122440",
  winBg:      "#141428",
  winTitle:   "#1a1a32",
  border:     "#1a3355",
  borderDim:  "#0d1a2a",
  borderHi:   "#3d7ab5",
  borderGrn:  "#1e4a30",
  text:       "#c8d4ea",
  textSub:    "#6b7d94",
  textDim:    "#2d3f52",
  textBright: "#eef2f8",
  green:      "#4ade80",
  greenBg:    "#091a0f",
  greenDim:   "#1a3d24",
  red:        "#f87171",
  redBg:      "#190808",
  redDim:     "#3d1515",
  yellow:     "#fbbf24",
  yellowBg:   "#1a1200",
  blue:       "#60a5fa",
  cyan:       "#34d399",
  dot1:       "#ff5f57",
  dot2:       "#ffbd2e",
  dot3:       "#28c841",
} as const;

// ── Typography scale: 4 levels ───────────────────────────────────────────────
// meta:    0.72em  – breadcrumbs, timestamps, footnotes
// small:   0.82em  – table data, secondary labels, sub-values
// body:    0.88em  – setting labels, descriptions, form fields
// base:    1.00em  – prayer names, panel titles (inherited)

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type Screen =
  | "dashboard" | "settings" | "prayer-config" | "status"
  | "notif-settings" | "location" | "adhan-alert" | "mosque-reminder"
  | "confirm" | "error" | "loading" | "states";

type PrayerState =
  | "passed" | "completed" | "next" | "pre-adhan"
  | "adhan" | "post-adhan" | "upcoming";

type TermSize = "large" | "medium" | "small";

interface Prayer  { name: string; short: string; time: string; state: PrayerState; }
interface PConfig { name: string; beforeMin: number; afterMin: number; adhan: boolean; notif: boolean; }

// ══════════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════════

const PRAYERS: Prayer[] = [
  { name: "FAJR",    short: "Fajr",    time: "04:50", state: "passed"   },
  { name: "DHUHR",   short: "Dhuhr",   time: "12:39", state: "passed"   },
  { name: "ASR",     short: "Asr",     time: "16:15", state: "next"     },
  { name: "MAGHRIB", short: "Maghrib", time: "18:59", state: "upcoming" },
  { name: "ISHA",    short: "Isha",    time: "20:22", state: "upcoming" },
];

const PCONFIGS: PConfig[] = [
  { name: "FAJR",    beforeMin: 15, afterMin: 20, adhan: true, notif: true },
  { name: "DHUHR",   beforeMin: 10, afterMin: 30, adhan: true, notif: true },
  { name: "ASR",     beforeMin: 15, afterMin: 20, adhan: true, notif: true },
  { name: "MAGHRIB", beforeMin: 5,  afterMin: 15, adhan: true, notif: true },
  { name: "ISHA",    beforeMin: 15, afterMin: 30, adhan: true, notif: true },
];

export const TERM_DIMS: Record<TermSize, { label: string; w: number; h: number }> = {
  large:  { label: "120×35", w: 936, h: 683 },
  medium: { label: "100×30", w: 780, h: 585 },
  small:  { label: "80×24",  w: 624, h: 468 },
};

// ══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ══════════════════════════════════════════════════════════════════════════════

function useCountdown() {
  const [t, setT] = useState({ h: 1, m: 29, s: 3 });
  useEffect(() => {
    const id = setInterval(() => {
      setT(p => {
        let { h, m, s } = p;
        if (--s < 0) { s = 59; if (--m < 0) { m = 59; h = Math.max(0, h - 1); } }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useNow() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useBlink(ms = 560) {
  const [v, setV] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setV(x => !x), ms);
    return () => clearInterval(id);
  }, [ms]);
  return v;
}

// ══════════════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════════

const pad = (n: number) => String(n).padStart(2, "0");

function Bar({ pct, width = 48, col = C.green }: { pct: number; width?: number; col?: string }) {
  const filled = Math.round(Math.max(0, Math.min(1, pct)) * width);
  return (
    <span>
      <span style={{ color: col }}>{"█".repeat(filled)}</span>
      <span style={{ color: C.borderDim }}>{"░".repeat(width - filled)}</span>
    </span>
  );
}

// Horizontal rule using unicode ─
function HR({ col, my = 4 }: { col?: string; my?: number }) {
  return (
    <div style={{
      color: col ?? C.borderDim,
      userSelect: "none", overflow: "hidden", whiteSpace: "nowrap",
      marginTop: my, marginBottom: my,
    }}>
      {"─".repeat(400)}
    </div>
  );
}

// Panel with ╭╮╰╯ corners + CSS side borders
function Panel({
  title, titleCol, borderCol, active, bg, children, flex, style,
}: {
  title?: string; titleCol?: string; borderCol?: string; active?: boolean;
  bg?: string; children: React.ReactNode; flex?: number; style?: React.CSSProperties;
}) {
  const bc = active ? C.borderHi : (borderCol || C.border);
  const tc = titleCol || C.textSub;
  return (
    <div style={{ display: "flex", flexDirection: "column", flex, ...style }}>
      <div style={{ display: "flex", color: bc, lineHeight: "1.4", userSelect: "none", flexShrink: 0 }}>
        <span>╭</span>
        {title && <span style={{ whiteSpace: "nowrap" }}>─ <span style={{ color: tc }}>{title}</span> </span>}
        <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>{"─".repeat(400)}</span>
        <span>╮</span>
      </div>
      <div style={{
        flex: 1, background: bg ?? C.panelBg, minHeight: 0,
        borderLeft: `1px solid ${bc}`, borderRight: `1px solid ${bc}`,
        padding: "8px 14px",
      }}>
        {children}
      </div>
      <div style={{ display: "flex", color: bc, lineHeight: "1.4", userSelect: "none", flexShrink: 0 }}>
        <span>╰</span>
        <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>{"─".repeat(400)}</span>
        <span>╯</span>
      </div>
    </div>
  );
}

// Prayer state badge: symbol + label, color by state
function Badge({ state }: { state: PrayerState }) {
  const cfg: Record<PrayerState, { sym: string; label: string; col: string }> = {
    passed:      { sym: "✓", label: "passed",    col: C.textDim  },
    completed:   { sym: "✓", label: "completed", col: C.green    },
    next:        { sym: "●", label: "next",       col: C.green    },
    "pre-adhan": { sym: "◈", label: "soon",       col: C.yellow   },
    adhan:       { sym: "◉", label: "adhan",      col: C.red      },
    "post-adhan":{ sym: "◉", label: "reminder",   col: C.red      },
    upcoming:    { sym: "○", label: "upcoming",   col: C.textSub  },
  };
  const { sym, label, col } = cfg[state];
  return <span style={{ color: col }}>{sym} {label}</span>;
}

// Inline key hint: [KEY] label
function KH({ k, label }: { k: string; label: string }) {
  return (
    <span style={{ marginRight: 12, whiteSpace: "nowrap" }}>
      <span style={{ color: C.green }}>[{k}]</span>
      <span style={{ color: C.textSub }}> {label}</span>
    </span>
  );
}

// Breadcrumb header shown at top of every sub-screen
function Crumb({ path, hint }: { path: string; hint?: string }) {
  return (
    <div style={{
      fontSize: "0.72em", color: C.textDim,
      letterSpacing: "0.14em", marginBottom: 10,
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
    }}>
      <span>{path}</span>
      {hint && <span style={{ color: C.textDim, letterSpacing: "0.08em" }}>{hint}</span>}
    </div>
  );
}

// Terminal-style button: no border-radius, consistent styling
function TBtn({
  children, onClick, variant = "ghost", style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost" | "outline";
  style?: React.CSSProperties;
}) {
  const vs: Record<string, React.CSSProperties> = {
    primary: { background: C.green,  border: "none",                   color: "#080d18",  fontWeight: 700 },
    danger:  { background: C.red,    border: "none",                   color: "#080408",  fontWeight: 700 },
    ghost:   { background: "none",   border: `1px solid ${C.border}`,  color: C.textDim               },
    outline: { background: "none",   border: `1px solid ${C.borderHi}`,color: C.text                  },
  };
  return (
    <button onClick={onClick} style={{
      fontFamily: "inherit", fontSize: "0.82em", cursor: "pointer",
      padding: "5px 16px", letterSpacing: "0.08em",
      borderRadius: 0,
      ...vs[variant], ...style,
    }}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHELL: TUI Header & Footer
// ══════════════════════════════════════════════════════════════════════════════

function TUIHeader({ size }: { size: TermSize }) {
  const now = useNow();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const small = size === "small";

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      padding: "5px 14px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#080c15", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: C.green, fontWeight: 700, letterSpacing: "0.16em", fontSize: "0.92em" }}>
          SALAT
        </span>
        {!small && <span style={{ color: C.borderHi, fontSize: "0.72em" }}>v0.1.0</span>}
      </div>
      <div style={{ display: "flex", gap: 0, alignItems: "center", fontSize: "0.72em", color: C.textSub }}>
        {!small && <><span>TAMOKRA, BÉJAÏA, ALGERIA</span><span style={{ color: C.borderDim, margin: "0 10px" }}>│</span></>}
        {!small && <><span>{dateStr}</span><span style={{ color: C.borderDim, margin: "0 10px" }}>│</span></>}
        <span style={{ color: C.green, fontWeight: 600, letterSpacing: "0.04em" }}>{timeStr}</span>
      </div>
    </div>
  );
}

function TUIFooter({
  screen, onNav, size,
}: { screen: Screen; onNav: (s: Screen) => void; size: TermSize }) {
  const isMain = ["dashboard", "settings", "prayer-config", "status"].includes(screen);
  const small = size === "small";

  return (
    <div style={{
      borderTop: `1px solid ${C.border}`,
      padding: "4px 14px",
      display: "flex", flexWrap: "wrap", gap: 2,
      background: "#080c15",
      fontSize: "0.78em", flexShrink: 0, alignItems: "center",
    }}>
      {isMain ? (
        <>
          {(["dashboard", "settings", "prayer-config", "status"] as Screen[]).map((s, i) => {
            const labels = ["TODAY", "SETTINGS", "PRAYERS", "STATUS"];
            const active = screen === s;
            return (
              <button key={s} onClick={() => onNav(s)} style={{
                background: active ? C.green : "none",
                border: "none", borderRadius: 0,
                color: active ? "#080d18" : C.textSub,
                fontFamily: "inherit", fontSize: "inherit",
                cursor: "pointer", padding: "2px 8px",
              }}>
                <span style={{ color: active ? "#080d18" : C.green, fontWeight: 700 }}>[{i + 1}]</span>
                {!small && <span style={{ color: active ? "#080d18" : C.textSub }}> {labels[i]}</span>}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          <span style={{ color: C.textDim, marginRight: 6 }}>
            <span style={{ color: C.red }}>[Q]</span>{!small && " QUIT"}
          </span>
        </>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, color: C.textSub }}>
          <KH k="↑↓"    label="move"   />
          <KH k="←→"    label="adjust" />
          <KH k="ENTER" label="select" />
          <KH k="ESC"   label="back"   />
          {!small && <KH k="S" label="save" />}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Dashboard
// ══════════════════════════════════════════════════════════════════════════════

// Shared prayer table — fixed-width CSS grid columns for perfect alignment
function PrayerTable({ size }: { size: TermSize }) {
  const small = size === "small";
  // col widths: indicator+name | time | status | notify
  const cols = small
    ? "90px 52px 1fr"
    : "100px 52px 1fr 44px";

  return (
    <div style={{ fontSize: "0.82em" }}>
      {/* Header row */}
      <div style={{
        display: "grid", gridTemplateColumns: cols,
        color: C.textDim, fontSize: "0.82em", letterSpacing: "0.1em",
        paddingBottom: 4, marginBottom: 2,
      }}>
        <span>PRAYER</span>
        <span>TIME</span>
        <span>STATUS</span>
        {!small && <span style={{ textAlign: "right" }}>NOTIF</span>}
      </div>
      <HR my={2} />
      {PRAYERS.map((p, i) => {
        const isNext   = p.state === "next";
        const isPassed = p.state === "passed";
        const rowBg    = isNext ? C.rowActive : "transparent";
        const rowBL    = isNext ? `2px solid ${C.green}` : "2px solid transparent";

        return (
          <div key={p.name} style={{
            display: "grid", gridTemplateColumns: cols,
            alignItems: "center",
            background: rowBg,
            borderLeft: rowBL,
            padding: isNext ? "4px 6px 4px 8px" : "3px 6px 3px 10px",
            margin: isNext ? "2px -14px" : "0 -14px",
            paddingLeft: isNext ? "22px" : "10px",
          }}>
            <span style={{
              color: isNext ? C.green : isPassed ? C.textDim : C.text,
              fontWeight: isNext ? 700 : 400,
            }}>
              {isNext ? "▶ " : "  "}{p.short}
            </span>
            <span style={{ color: isPassed ? C.textDim : C.textSub, fontVariantNumeric: "tabular-nums" }}>
              {p.time}
            </span>
            <span><Badge state={p.state} /></span>
            {!small && (
              <span style={{ color: C.textDim, textAlign: "right", fontSize: "0.88em" }}>
                -{PCONFIGS[i].beforeMin}m
              </span>
            )}
          </div>
        );
      })}
      <HR my={4} />
      <div style={{ color: C.textDim, fontSize: "0.82em" }}>
        Hijri: 26 Rabi al-awwal 1448 AH · Qibla: 106.4°
      </div>
    </div>
  );
}

function DashboardScreen({ size }: { size: TermSize }) {
  const cd = useCountdown();
  const total = 3600 * 3 + 60 * 36;
  const elapsed = total - (cd.h * 3600 + cd.m * 60 + cd.s);
  const pct = elapsed / total;
  const cdStr = `${pad(cd.h)}:${pad(cd.m)}:${pad(cd.s)}`;
  const small  = size === "small";
  const medium = size === "medium";

  // ─ 80×24: Single column, countdown is centred and large ─
  if (small) {
    return (
      <div style={{
        flex: 1, overflow: "hidden",
        padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8,
      }}>
        {/* Next prayer — focal point */}
        <Panel title="NEXT PRAYER" active>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.green, fontWeight: 700, letterSpacing: "0.14em", fontSize: "0.92em", marginBottom: 2 }}>
              ● ASR · 16:15
            </div>
            <div style={{
              color: C.textBright, fontWeight: 700,
              fontSize: "2.4em", letterSpacing: "0.06em", lineHeight: 1.1,
              margin: "4px 0 2px",
            }}>
              {cdStr}
            </div>
            <div style={{ color: C.textSub, fontSize: "0.72em", letterSpacing: "0.12em", marginBottom: 6 }}>
              REMAINING
            </div>
            <Bar pct={pct} width={34} />
          </div>
        </Panel>

        {/* Prayer table */}
        <Panel title="TODAY">
          <PrayerTable size={size} />
        </Panel>

        {/* Status strip */}
        <div style={{ fontSize: "0.72em", color: C.textDim, display: "flex", gap: 10 }}>
          <span><span style={{ color: C.green }}>●</span> svc</span>
          <span><span style={{ color: C.green }}>●</span> notif</span>
          <span><span style={{ color: C.green }}>●</span> adhan</span>
        </div>
      </div>
    );
  }

  // ─ 100×30 and 120×35: Two-column ─
  return (
    <div style={{
      flex: 1, overflow: "hidden",
      padding: medium ? "10px 12px" : "12px 16px",
      display: "flex", flexDirection: "column",
      gap: medium ? 8 : 10,
    }}>
      {/* Greeting — hide on medium to save height */}
      {!medium && (
        <div style={{ fontSize: "0.72em", color: C.textDim, paddingLeft: 2 }}>
          ASSALAMU ALAIKUM · Tuesday · 26 Rabi al-awwal 1448 AH
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: "flex", gap: medium ? 8 : 12, flex: 1, minHeight: 0 }}>

        {/* Left: Next Prayer */}
        <Panel title="NEXT PRAYER" active style={{ width: medium ? "45%" : "44%" }}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Prayer name + scheduled time */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 10,
            }}>
              <div>
                <div style={{
                  color: C.green, fontWeight: 700,
                  letterSpacing: "0.16em", fontSize: "1.05em",
                }}>
                  ASR
                </div>
                <div style={{ color: C.green, fontSize: "0.72em", marginTop: 1 }}>
                  ● NEXT PRAYER
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.textDim, fontSize: "0.72em", letterSpacing: "0.1em" }}>SCHEDULED</div>
                <div style={{
                  color: C.text, fontWeight: 700,
                  fontSize: "1.1em", fontVariantNumeric: "tabular-nums",
                }}>
                  16:15
                </div>
              </div>
            </div>

            {/* Countdown — primary focal point */}
            <div style={{ textAlign: "center", margin: medium ? "4px 0 10px" : "6px 0 14px" }}>
              <div style={{
                color: C.textBright, fontWeight: 700,
                fontSize: medium ? "2.2em" : "2.8em",
                letterSpacing: "0.06em", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {cdStr}
              </div>
              <div style={{
                color: C.textSub, fontSize: "0.72em",
                letterSpacing: "0.14em", marginTop: 4,
              }}>
                REMAINING
              </div>
            </div>

            {/* Progress gauge */}
            <div style={{ marginBottom: 6 }}>
              <Bar pct={pct} width={medium ? 32 : 40} />
              <div style={{
                display: "flex", justifyContent: "space-between",
                color: C.textDim, fontSize: "0.72em", marginTop: 3,
                fontVariantNumeric: "tabular-nums",
              }}>
                <span>Dhuhr 12:39</span>
                <span style={{ color: C.green }}>{Math.round(pct * 100)}%</span>
                <span>Asr 16:15</span>
              </div>
            </div>

            <HR />

            {/* Notification schedule */}
            <div style={{ fontSize: "0.82em", marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: C.textDim }}>Notify before</span>
                <span style={{ color: C.yellow }}>15 min · at 16:00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textDim }}>Mosque reminder</span>
                <span style={{ color: C.textSub }}>+20 min after</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Right: Prayer table */}
        <Panel title="TODAY'S PRAYERS" flex={1}>
          <PrayerTable size={size} />
          {!medium && (
            <>
              <HR my={8} />
              <div style={{ fontSize: "0.82em" }}>
                <div style={{ color: C.textDim, fontSize: "0.82em", letterSpacing: "0.1em", marginBottom: 5 }}>
                  TONIGHT
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.textSub }}>Midnight (est.)</span>
                  <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums" }}>00:04</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span style={{ color: C.textSub }}>Fajr tomorrow</span>
                  <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums" }}>05:11</span>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Status strip */}
      <div style={{
        borderTop: `1px solid ${C.borderDim}`,
        paddingTop: 6,
        display: "flex", alignItems: "center", gap: 0,
        fontSize: "0.72em", color: C.textDim,
      }}>
        <span><span style={{ color: C.green }}>●</span> service</span>
        <span style={{ color: C.borderDim, margin: "0 10px" }}>│</span>
        <span><span style={{ color: C.green }}>●</span> notifications</span>
        <span style={{ color: C.borderDim, margin: "0 10px" }}>│</span>
        <span><span style={{ color: C.green }}>●</span> adhan</span>
        <span style={{ color: C.borderDim, margin: "0 10px" }}>│</span>
        <span><span style={{ color: C.green }}>●</span> audio</span>
        {!medium && (
          <>
            <span style={{ flex: 1 }} />
            <span>Union of Islamic Orgs · Africa/Algiers (UTC+1)</span>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Adhan Alert  (full-screen — no header/footer)
// ══════════════════════════════════════════════════════════════════════════════

function AdhanAlertScreen({ onDismiss }: { onDismiss: () => void }) {
  const blink = useBlink(500);
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: C.redBg,
      border: `2px solid ${C.red}`,
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: `1px solid ${C.redDim}`,
        padding: "6px 16px",
        display: "flex", justifyContent: "space-between",
        fontSize: "0.72em",
      }}>
        <span style={{ color: C.red, fontWeight: 700, letterSpacing: "0.2em" }}>SALAT</span>
        <span style={{
          color: C.red, letterSpacing: "0.3em", fontWeight: 700,
          opacity: blink ? 1 : 0.25, transition: "opacity 0.1s",
        }}>
          ◉ ADHAN
        </span>
        <span style={{ color: C.redDim }}>19:21</span>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{ color: C.redDim, fontSize: "0.72em", letterSpacing: "0.25em", marginBottom: 16 }}>
          ─────── PRAYER TIME ───────
        </div>

        <div style={{
          color: C.red, fontWeight: 700,
          fontSize: "3em", letterSpacing: "0.2em", lineHeight: 1,
          marginBottom: 4,
        }}>
          MAGHRIB
        </div>
        <div style={{ color: C.redDim, fontSize: "0.82em", marginBottom: 20 }}>
          19:21 · SÉTIF, ALGERIA
        </div>

        <div style={{
          color: C.textSub, fontSize: "0.92em",
          letterSpacing: "0.12em", marginBottom: 4,
        }}>
          اللَّهُ أَكْبَرُ · اللَّهُ أَكْبَرُ
        </div>
        <div style={{ color: C.redDim, fontSize: "0.82em", marginBottom: 24 }}>
          Allahu Akbar · Prayer time has begun
        </div>

        <HR col={C.redDim} />

        <div style={{ color: C.redDim, fontSize: "0.82em", margin: "12px 0 20px" }}>
          Mosque reminder in <span style={{ color: C.red }}>15 min</span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <TBtn onClick={onDismiss} variant="danger">[ENTER] DISMISS</TBtn>
          <TBtn onClick={onDismiss} variant="ghost" style={{ borderColor: C.redDim, color: C.redDim }}>
            [S] SNOOZE 3m
          </TBtn>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: `1px solid ${C.redDim}`,
        padding: "5px 16px",
        display: "flex", justifyContent: "space-between",
        fontSize: "0.72em", color: C.redDim,
      }}>
        <span>Adhan audio: Abdul Basit · Vol 80%</span>
        <span>ENTER dismiss · S snooze</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Mosque Reminder
// ══════════════════════════════════════════════════════════════════════════════

function MosqueReminderScreen({ onDismiss }: { onDismiss: () => void }) {
  const blink = useBlink(800);
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Panel
        borderCol={C.red} titleCol={C.red}
        title="MOSQUE REMINDER"
        bg={C.redBg}
        style={{ width: "clamp(340px, 70%, 500px)" }}
      >
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            color: C.red, fontSize: "0.72em",
            letterSpacing: "0.22em", marginBottom: 12,
            opacity: blink ? 1 : 0.4,
          }}>
            ◉ ── TIME TO HEAD OUT ── ◉
          </div>

          <div style={{
            color: C.red, fontWeight: 700,
            fontSize: "1.6em", letterSpacing: "0.14em", marginBottom: 4,
          }}>
            MAGHRIB
          </div>
          <div style={{ color: C.redDim, fontSize: "0.82em", marginBottom: 16 }}>
            Adhan was 15 minutes ago · 19:21
          </div>

          <HR col={C.redDim} />

          <div style={{ color: C.text, fontSize: "0.88em", margin: "14px 0 6px", lineHeight: 1.7 }}>
            It&apos;s time to head to the mosque.
          </div>
          <div style={{ color: C.redDim, fontSize: "0.82em", marginBottom: 16 }}>
            Iqama in approximately{" "}
            <span style={{ color: C.yellow }}>~5 minutes</span>
          </div>

          <HR col={C.redDim} />

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <TBtn onClick={onDismiss} variant="danger">[ENTER] DISMISS</TBtn>
            <TBtn onClick={onDismiss} variant="ghost" style={{ borderColor: C.redDim, color: C.redDim }}>
              [S] SNOOZE 5m
            </TBtn>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Settings
// ══════════════════════════════════════════════════════════════════════════════

function SettingsScreen({ onNav, size }: { onNav: (s: Screen) => void; size: TermSize }) {
  const [sel, setSel] = useState(0);
  const small = size === "small";

  type Entry = { key: string; value: string; sub?: string; action?: () => void };
  const sections: { label: string; items: Entry[] }[] = [
    {
      label: "GENERAL", items: [
        { key: "Location",           value: "Sétif, Algeria",       sub: "36.19°N · 5.41°E", action: () => onNav("location") },
        { key: "Calculation method", value: "Union of Islamic Orgs", sub: "MWL fallback"       },
        { key: "Time format",        value: "24h"                                               },
        { key: "Language",           value: "English"                                           },
      ],
    },
    {
      label: "NOTIFICATIONS", items: [
        { key: "Enable notifications", value: "ENABLED",    action: () => onNav("notif-settings") },
        { key: "Per-prayer timing",    value: "CONFIGURED", sub: "5–15 min before",  action: () => onNav("notif-settings") },
        { key: "Mosque reminder",      value: "ENABLED",    sub: "15–30 min after"   },
      ],
    },
    {
      label: "ADHAN", items: [
        { key: "Enable adhan",  value: "ENABLED"       },
        { key: "Sound preset",  value: "Abdul Basit"   },
        { key: "Volume",        value: "80%"           },
        { key: "Test adhan",    value: "[ PLAY ]",     action: () => {} },
      ],
    },
    {
      label: "DISPLAY", items: [
        { key: "Theme",              value: "Midnight Blue" },
        { key: "Compact mode",       value: "OFF"           },
        { key: "Show seconds",       value: "ON"            },
        { key: "Countdown progress", value: "ON"            },
      ],
    },
  ];

  const flat: (Entry & { section: string })[] = [];
  sections.forEach(s => s.items.forEach(i => flat.push({ ...i, section: s.label })));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!document.activeElement?.closest("[data-salat-tui]")) return;
      if (e.key === "ArrowDown") setSel(v => Math.min(v + 1, flat.length - 1));
      if (e.key === "ArrowUp")   setSel(v => Math.max(v - 1, 0));
      if (e.key === "Enter")     flat[sel]?.action?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, flat]);

  let idx = 0;
  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <Crumb path="SETTINGS" hint="↑↓ move · ENTER select · S save · ESC back" />

      {sections.map(section => {
        const sectionStart = idx;
        return (
          <Panel key={section.label} title={section.label} titleCol={C.textDim}>
            {section.items.map((item, ii) => {
              const i = sectionStart + ii;
              idx = i + 1;
              const active = sel === i;

              const valueColor =
                item.value === "ENABLED"    ? C.green
                : item.value === "DISABLED" ? C.red
                : item.value === "[ PLAY ]" ? C.cyan
                : item.value === "CONFIGURED" ? C.blue
                : C.textSub;

              return (
                <div key={item.key}
                  onClick={() => { setSel(i); item.action?.(); }}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "6px 6px 6px 8px",
                    cursor: "pointer",
                    background: active ? C.rowActive : "transparent",
                    borderLeft: `2px solid ${active ? C.borderHi : "transparent"}`,
                    margin: "0 -14px",
                    paddingLeft: active ? 18 : 8,
                    paddingRight: 14,
                  }}
                >
                  <div>
                    <div style={{ color: active ? C.textBright : C.text, fontSize: "0.88em" }}>
                      {active ? "› " : "  "}{item.key}
                      {item.action && (
                        <span style={{ color: C.textDim, marginLeft: 6, fontSize: "0.82em" }}>↵</span>
                      )}
                    </div>
                    {item.sub && !small && (
                      <div style={{ color: C.textDim, fontSize: "0.72em", paddingLeft: 14, marginTop: 1 }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                  <span style={{ color: valueColor, fontSize: "0.82em", flexShrink: 0, marginLeft: 12 }}>
                    {item.value}
                  </span>
                </div>
              );
            })}
          </Panel>
        );
      })}

      <div style={{ display: "flex", gap: 8 }}>
        <TBtn variant="primary">[S] SAVE</TBtn>
        <TBtn variant="ghost">[ESC] CANCEL</TBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Location
// ══════════════════════════════════════════════════════════════════════════════

function LocationScreen({ size }: { size: TermSize }) {
  const [mode, setMode] = useState<"view" | "search" | "coords">("view");
  const [lat, setLat]   = useState("36.1900");
  const [lng, setLng]   = useState("5.4100");
  const [q, setQ]       = useState("");
  const cursor = useBlink();
  const small  = size === "small";

  const fields: [string, string][] = [
    ["City",        "Sétif, Algeria"],
    ["Country",     "Algeria"],
    ["Latitude",    lat],
    ["Longitude",   lng],
    ["Timezone",    "Africa/Algiers (UTC+1)"],
    ["Calculation", "Union of Islamic Orgs"],
  ];

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <Crumb path="SETTINGS › LOCATION" hint="S save · ESC back" />

      <Panel title="CURRENT LOCATION" titleCol={C.textSub}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: "6px 16px",
          fontSize: "0.88em",
        }}>
          {fields.map(([k, v]) => (
            <Fragment key={k}>
              <span style={{ color: C.textDim }}>{k}</span>
              <span style={{ color: k === "Latitude" || k === "Longitude" ? C.green : C.text }}>
                {v}
              </span>
            </Fragment>
          ))}
        </div>
      </Panel>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["search", "coords", "view"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? C.borderHi : "none",
            border: `1px solid ${mode === m ? C.borderHi : C.border}`,
            color: mode === m ? C.textBright : C.textSub,
            fontFamily: "inherit", fontSize: "0.82em",
            padding: "4px 14px", cursor: "pointer", borderRadius: 0,
            letterSpacing: "0.06em",
          }}>
            {m === "search" ? "[ SEARCH CITY ]" : m === "coords" ? "[ COORDINATES ]" : "[ AUTO-DETECT ]"}
          </button>
        ))}
      </div>

      {mode === "search" && (
        <Panel title="SEARCH CITY" borderCol={C.borderHi} titleCol={C.green}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: C.green }}>›</span>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              autoFocus placeholder="Type city name..."
              style={{
                background: "transparent", border: "none", outline: "none",
                color: C.textBright, fontFamily: "inherit", fontSize: "0.88em", flex: 1,
              }}
            />
            <span style={{ color: C.green, opacity: cursor ? 1 : 0 }}>█</span>
          </div>
          {q && (
            <>
              <HR my={4} />
              <div style={{ marginTop: 4 }}>
                {["Sétif, Algeria", "Sétif Province, Algeria", "Bir El Arch, Sétif"].map(r => (
                  <div key={r}
                    style={{ padding: "4px 0", color: C.textDim, fontSize: "0.88em", cursor: "pointer" }}
                    onMouseOver={e => (e.currentTarget.style.color = C.green)}
                    onMouseOut={e => (e.currentTarget.style.color = C.textDim)}
                  >
                    ○ {r}
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      )}

      {mode === "coords" && (
        <Panel title="ENTER COORDINATES" borderCol={C.borderHi} titleCol={C.blue}>
          <div style={{
            display: "grid",
            gridTemplateColumns: small ? "1fr" : "90px 180px",
            gap: "10px 14px", alignItems: "center",
            fontSize: "0.88em",
          }}>
            <span style={{ color: C.textDim }}>Latitude</span>
            <input value={lat} onChange={e => setLat(e.target.value)} style={{
              background: C.rowActive, border: `1px solid ${C.border}`,
              outline: "none", color: C.green,
              fontFamily: "inherit", fontSize: "inherit", padding: "4px 8px", borderRadius: 0,
            }} />
            <span style={{ color: C.textDim }}>Longitude</span>
            <input value={lng} onChange={e => setLng(e.target.value)} style={{
              background: C.rowActive, border: `1px solid ${C.border}`,
              outline: "none", color: C.green,
              fontFamily: "inherit", fontSize: "inherit", padding: "4px 8px", borderRadius: 0,
            }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <TBtn variant="primary">[ENTER] CONFIRM</TBtn>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Notification Settings
// ══════════════════════════════════════════════════════════════════════════════

function NotifSettingsScreen({ size }: { size: TermSize }) {
  const [cfgs, setCfgs] = useState<PConfig[]>(PCONFIGS);
  const [row, setRow]   = useState(0);
  const [col, setCol]   = useState(0);
  const small = size === "small";

  const adj = (r: number, field: "beforeMin" | "afterMin", d: number) => {
    setCfgs(prev =>
      prev.map((c, i) =>
        i !== r ? c : { ...c, [field]: Math.max(0, Math.min(60, c[field] + d)) }
      )
    );
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!document.activeElement?.closest("[data-salat-tui]")) return;
      if (e.key === "ArrowDown")  setRow(v => Math.min(v + 1, cfgs.length - 1));
      if (e.key === "ArrowUp")    setRow(v => Math.max(v - 1, 0));
      if (e.key === "Tab")        { e.preventDefault(); setCol(v => (v + 1) % 2); }
      if (e.key === "ArrowRight") adj(row, col === 0 ? "beforeMin" : "afterMin", 1);
      if (e.key === "ArrowLeft")  adj(row, col === 0 ? "beforeMin" : "afterMin", -1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [row, col, cfgs]);

  const cols = small
    ? "76px 1fr 1fr"
    : "100px 1fr 1fr 58px 58px";

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <Crumb
        path="SETTINGS › NOTIFICATIONS"
        hint="↑↓ row · TAB col · ←→ adjust"
      />

      <Panel title="PER-PRAYER TIMING" titleCol={C.textSub}>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: cols,
          color: C.textDim, fontSize: "0.72em",
          letterSpacing: "0.1em", paddingBottom: 4,
        }}>
          <span>PRAYER</span>
          <span>BEFORE ADHAN</span>
          <span>AFTER ADHAN</span>
          {!small && (
            <>
              <span style={{ textAlign: "center" }}>ADHAN</span>
              <span style={{ textAlign: "center" }}>NOTIF</span>
            </>
          )}
        </div>
        <HR my={2} />

        {cfgs.map((cfg, i) => {
          const isRow = i === row;

          const NumCell = ({
            field, cIdx,
          }: { field: "beforeMin" | "afterMin"; cIdx: number }) => {
            const focused = isRow && col === cIdx;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button
                  onClick={e => { e.stopPropagation(); adj(i, field, -1); }}
                  style={{
                    background: "none", border: "none", borderRadius: 0,
                    cursor: "pointer", fontFamily: "inherit",
                    color: focused ? C.green : C.textDim, fontSize: "0.88em", padding: "0 3px",
                  }}
                >◂</button>
                <span style={{
                  minWidth: 40, textAlign: "center", fontSize: "0.88em",
                  color: focused ? C.textBright : C.textSub,
                  background: focused ? C.rowSel : "transparent",
                  padding: "1px 4px",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {cfg[field]} min
                </span>
                <button
                  onClick={e => { e.stopPropagation(); adj(i, field, 1); }}
                  style={{
                    background: "none", border: "none", borderRadius: 0,
                    cursor: "pointer", fontFamily: "inherit",
                    color: focused ? C.green : C.textDim, fontSize: "0.88em", padding: "0 3px",
                  }}
                >▸</button>
              </div>
            );
          };

          return (
            <div key={cfg.name}
              onClick={() => setRow(i)}
              style={{
                display: "grid", gridTemplateColumns: cols,
                alignItems: "center",
                padding: "7px 6px",
                margin: "0 -14px", paddingLeft: isRow ? 22 : 8, paddingRight: 14,
                cursor: "pointer",
                background: isRow ? C.rowActive : "transparent",
                borderLeft: `2px solid ${isRow ? C.green : "transparent"}`,
              }}
            >
              <span style={{
                color: isRow ? C.green : C.textSub,
                fontWeight: isRow ? 700 : 400,
                fontSize: "0.88em",
              }}>
                {isRow ? "▶ " : "  "}{cfg.name}
              </span>
              <NumCell field="beforeMin" cIdx={0} />
              <NumCell field="afterMin"  cIdx={1} />
              {!small && (
                <>
                  <span style={{
                    textAlign: "center", fontSize: "0.82em",
                    color: cfg.adhan ? C.green : C.textDim,
                  }}>
                    {cfg.adhan ? "ON" : "OFF"}
                  </span>
                  <span style={{
                    textAlign: "center", fontSize: "0.82em",
                    color: cfg.notif ? C.green : C.textDim,
                  }}>
                    {cfg.notif ? "ON" : "OFF"}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </Panel>

      {/* Timeline preview */}
      <Panel title="TIMELINE PREVIEW" titleCol={C.textDim}>
        <div style={{ fontSize: "0.82em" }}>
          {cfgs.map((cfg, i) => (
            <div key={cfg.name} style={{
              display: "flex", alignItems: "center",
              marginBottom: 4, gap: 0,
              opacity: i === row ? 1 : 0.35,
            }}>
              <span style={{
                color: i === row ? C.green : C.textSub,
                minWidth: 80, fontSize: "0.88em",
              }}>
                {cfg.name}
              </span>
              <span style={{ color: C.yellow }}>◆</span>
              <span style={{ color: C.borderDim, fontSize: "0.72em" }}>─{cfg.beforeMin}m─</span>
              <span style={{ color: C.red }}>◉ adhan</span>
              <span style={{ color: C.borderDim, fontSize: "0.72em" }}>─{cfg.afterMin}m─</span>
              <span style={{ color: C.red }}>◉ mosque</span>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 8 }}>
        <TBtn variant="primary">[S] SAVE</TBtn>
        <TBtn variant="ghost">[ESC] CANCEL</TBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Per-Prayer Configuration
// ══════════════════════════════════════════════════════════════════════════════

function PrayerConfigScreen(_props: { size: TermSize }) {
  const [sel, setSel]   = useState(3);
  const [cfgs, setCfgs] = useState<PConfig[]>(PCONFIGS);
  const cfg  = cfgs[sel];

  const adj = (field: "beforeMin" | "afterMin", d: number) => {
    setCfgs(prev =>
      prev.map((c, i) =>
        i !== sel ? c : { ...c, [field]: Math.max(0, Math.min(60, c[field] + d)) }
      )
    );
  };
  const tog = (field: "adhan" | "notif") => {
    setCfgs(prev =>
      prev.map((c, i) => i !== sel ? c : { ...c, [field]: !c[field] })
    );
  };

  const StepCtrl = ({
    label, field,
  }: { label: string; field: "beforeMin" | "afterMin" }) => (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: 8,
    }}>
      <span style={{ color: C.textSub, fontSize: "0.88em" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TBtn onClick={() => adj(field, -5)} variant="ghost" style={{ padding: "3px 8px" }}>◂ 5</TBtn>
        <span style={{
          color: C.textBright, minWidth: 56, textAlign: "center",
          background: C.rowSel, padding: "3px 10px", fontSize: "0.88em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {cfg[field]} min
        </span>
        <TBtn onClick={() => adj(field, 5)} variant="ghost" style={{ padding: "3px 8px" }}>5 ▸</TBtn>
      </div>
    </div>
  );

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <Crumb path="SETTINGS › PRAYER CONFIGURATION" hint="←→ tab · ENTER · ESC back" />

      {/* Prayer tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
        {PRAYERS.map((p, i) => {
          const active = i === sel;
          return (
            <button key={p.name} onClick={() => setSel(i)} style={{
              background: active ? C.rowActive : "none",
              border: "none",
              borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
              borderRadius: 0,
              color: active ? C.green : C.textDim,
              fontFamily: "inherit", fontSize: "0.82em",
              fontWeight: active ? 700 : 400,
              padding: "5px 14px", cursor: "pointer",
              letterSpacing: "0.08em",
              marginBottom: "-1px",
            }}>
              {p.short}
            </button>
          );
        })}
      </div>

      <Panel
        title={`${cfg.name} · ${PRAYERS[sel].time}`}
        titleCol={C.green}
        borderCol={C.borderGrn}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <StepCtrl label="Before Adhan notification"  field="beforeMin" />
          <StepCtrl label="After Adhan mosque reminder" field="afterMin"  />

          <HR />

          {([
            { label: "Adhan sound",   field: "adhan" as const },
            { label: "Notifications", field: "notif" as const },
          ] as const).map(({ label, field }) => (
            <div key={field} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ color: C.textSub, fontSize: "0.88em" }}>{label}</span>
              <button onClick={() => tog(field)} style={{
                background: "none",
                border: `1px solid ${cfg[field] ? C.green : C.border}`,
                borderRadius: 0,
                color: cfg[field] ? C.green : C.textDim,
                fontFamily: "inherit", fontSize: "0.82em",
                padding: "3px 16px", cursor: "pointer",
                minWidth: 88, letterSpacing: "0.08em",
              }}>
                {cfg[field] ? "ENABLED" : "DISABLED"}
              </button>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.textSub, fontSize: "0.88em" }}>Sound preset</span>
            <span style={{ color: C.textDim, fontSize: "0.82em" }}>◂ Abdul Basit ▸</span>
          </div>
        </div>
      </Panel>

      {/* Notification timeline */}
      <Panel title="NOTIFICATION TIMELINE" titleCol={C.textDim}>
        <div style={{
          fontSize: "0.82em", display: "flex",
          alignItems: "center", gap: 2, flexWrap: "nowrap", overflow: "hidden",
        }}>
          <span style={{ color: C.textDim, whiteSpace: "nowrap" }}>─{cfg.beforeMin}m─</span>
          <span style={{ color: C.yellow, whiteSpace: "nowrap" }}>◆ NOTIFY</span>
          <span style={{ flex: 1, overflow: "hidden", color: C.borderDim, whiteSpace: "nowrap" }}>{"─".repeat(80)}</span>
          <span style={{ color: C.red, whiteSpace: "nowrap" }}>◉ ADHAN {PRAYERS[sel].time}</span>
          <span style={{ flex: 1, overflow: "hidden", color: C.borderDim, whiteSpace: "nowrap" }}>{"─".repeat(80)}</span>
          <span style={{ color: C.red, whiteSpace: "nowrap" }}>◉ MOSQUE</span>
          <span style={{ color: C.textDim, whiteSpace: "nowrap" }}>─+{cfg.afterMin}m</span>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: System Status
// ══════════════════════════════════════════════════════════════════════════════

function StatusScreen({ size }: { size: TermSize }) {
  const cd = useCountdown();
  const cdStr = `${pad(cd.h)}:${pad(cd.m)}:${pad(cd.s)}`;
  const small = size === "small";

  const services = [
    { name: "Prayer service",     status: "RUNNING",        ok: true },
    { name: "Prayer calculation", status: "OK",             ok: true },
    { name: "Location",           status: "SÉTIF, ALGERIA", ok: true },
    { name: "Timezone",           status: "UTC+1",          ok: true },
    { name: "Notifications",      status: "ENABLED",        ok: true },
    { name: "Adhan sound",        status: "ENABLED",        ok: true },
    { name: "Audio system",       status: "READY",          ok: true },
    { name: "Network",            status: "ONLINE",         ok: true },
    { name: "Config file",        status: "OK",             ok: true },
    { name: "Prayer database",    status: "LOADED",         ok: true },
  ];

  const events = [
    { time: "19:16", label: "Pre-Adhan notification", sub: "MAGHRIB · 5 min window",  col: C.yellow },
    { time: "18:21", label: "Asr prayer passed",       sub: "status updated",          col: C.textDim },
    { time: "16:18", label: "Asr Adhan played",        sub: "duration 0:32",           col: C.blue   },
    { time: "16:03", label: "Pre-Adhan notification", sub: "ASR · 15 min window",     col: C.yellow },
    { time: "12:43", label: "Dhuhr Adhan played",      sub: "duration 0:28",           col: C.blue   },
    { time: "12:33", label: "Pre-Adhan notification", sub: "DHUHR · 10 min window",   col: C.yellow },
    { time: "05:12", label: "Fajr Adhan played",       sub: "duration 0:34",           col: C.blue   },
  ];

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <Crumb path="SYSTEM STATUS" hint={new Date().toLocaleTimeString("en-GB")} />

      <div style={{ display: small ? "flex" : "flex", flexDirection: small ? "column" : "row", gap: 10 }}>
        {/* Services */}
        <Panel title="SERVICES" flex={1}>
          <div style={{ fontSize: "0.82em" }}>
            {services.map(s => (
              <div key={s.name} style={{
                display: "flex", justifyContent: "space-between",
                padding: "4px 0",
                borderBottom: `1px solid ${C.borderDim}`,
              }}>
                <span style={{ color: C.textSub }}>{s.name}</span>
                <span style={{ color: s.ok ? C.green : C.red }}>
                  {s.ok ? "●" : "✕"} {s.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right column: next event + summary */}
        {!small && (
          <div style={{ width: "42%", display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel title="NEXT EVENT" active>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.green, fontWeight: 700, letterSpacing: "0.14em" }}>MAGHRIB</div>
                <div style={{ color: C.textSub, fontSize: "0.82em", marginTop: 2 }}>19:21 · SÉTIF</div>
                <div style={{
                  color: C.textBright, fontWeight: 700,
                  fontSize: "2em", letterSpacing: "0.06em",
                  margin: "8px 0 4px",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {cdStr}
                </div>
                <div style={{ color: C.textDim, fontSize: "0.72em", letterSpacing: "0.12em", marginBottom: 8 }}>
                  REMAINING
                </div>
                <Bar pct={0.62} width={26} />
              </div>
            </Panel>

            <Panel title="TODAY" titleCol={C.textDim}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "5px 12px",
                fontSize: "0.82em",
              }}>
                {[
                  ["Total prayers",  "5"],
                  ["Passed",         "3"],
                  ["Remaining",      "2"],
                  ["Notifications",  "4 sent"],
                  ["Adhan plays",    "3"],
                  ["Next notify",    "1:37:37"],
                ].map(([k, v]) => (
                  <Fragment key={k}>
                    <span style={{ color: C.textDim }}>{k}</span>
                    <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </Fragment>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>

      {/* Event log */}
      <Panel title="RECENT EVENTS · TODAY" titleCol={C.textDim}>
        <div style={{ fontSize: "0.82em" }}>
          {events.map((e, i) => (
            <div key={i} style={{
              display: "flex", gap: 10,
              padding: "4px 0",
              borderBottom: `1px solid ${C.borderDim}`,
            }}>
              <span style={{
                color: C.textDim, minWidth: 38, flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
              }}>
                {e.time}
              </span>
              <span style={{ color: C.borderDim, flexShrink: 0 }}>│</span>
              <span style={{ color: e.col, flex: 1 }}>{e.label}</span>
              {!small && (
                <span style={{ color: C.textDim, fontSize: "0.88em", flexShrink: 0 }}>{e.sub}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Confirmation
// ══════════════════════════════════════════════════════════════════════════════

function ConfirmScreen({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Panel
        borderCol={C.green} titleCol={C.green}
        title="SAVED" bg={C.greenBg}
        style={{ width: "clamp(300px, 55%, 460px)" }}
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ color: C.green, fontSize: "1.8em", marginBottom: 10 }}>✓</div>
          <div style={{
            color: C.green, fontWeight: 700,
            letterSpacing: "0.16em", fontSize: "0.92em", marginBottom: 8,
          }}>
            SETTINGS SAVED
          </div>
          <div style={{ color: C.textDim, fontSize: "0.82em", marginBottom: 4 }}>
            ~/.config/salat/config.toml
          </div>
          <div style={{ color: C.greenDim, fontSize: "0.82em", marginBottom: 18 }}>
            Prayer times recalculated.
          </div>
          <TBtn onClick={onBack} variant="primary">[ENTER] CONTINUE</TBtn>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Error
// ══════════════════════════════════════════════════════════════════════════════

function ErrorScreen({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Panel
        borderCol={C.red} titleCol={C.red}
        title="ERROR" bg={C.redBg}
        style={{ width: "clamp(340px, 65%, 540px)" }}
      >
        <div>
          <div style={{
            color: C.red, fontWeight: 700,
            letterSpacing: "0.12em", fontSize: "0.88em", marginBottom: 12,
          }}>
            ✕ LOCATION LOOKUP FAILED
          </div>
          <div style={{ color: C.textDim, fontSize: "0.88em", lineHeight: 1.7, marginBottom: 12 }}>
            Could not resolve coordinates for the specified location.
            Check network connection or enter coordinates manually.
          </div>

          {/* Rust-style error trace */}
          <div style={{
            background: "#100808", border: `1px solid ${C.redDim}`,
            padding: "8px 12px", marginBottom: 16,
            fontSize: "0.82em", lineHeight: 1.7, fontFamily: "inherit",
          }}>
            <div style={{ color: C.red }}>error[E001]: geocoding failed</div>
            <div style={{ color: C.redDim }}>  → HTTP 503 Service Unavailable</div>
            <div style={{ color: C.redDim }}>  → retried 3×  (1s · 2s · 4s)</div>
            <div style={{ color: C.redDim }}>  → giving up</div>
            <div style={{ color: C.textDim, marginTop: 4 }}>
              help: use [C] coordinates or [R] retry
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <TBtn onClick={onBack} variant="ghost" style={{ borderColor: C.red, color: C.red }}>[R] RETRY</TBtn>
            <TBtn onClick={onBack} variant="ghost">[C] COORDINATES</TBtn>
            <TBtn onClick={onBack} variant="ghost">[ESC] BACK</TBtn>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Loading / Initializing
// ══════════════════════════════════════════════════════════════════════════════

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const blink = useBlink(300);
  const dots  = ".".repeat((step % 3) + 1);

  useEffect(() => {
    const id = setInterval(() => setStep(s => s + 1), 400);
    return () => clearInterval(id);
  }, []);

  const steps = [
    { label: "Loading configuration",    done: step > 1  },
    { label: "Resolving location",       done: step > 3  },
    { label: "Calculating prayer times", done: step > 5  },
    { label: "Initializing audio",       done: step > 7  },
    { label: "Starting prayer service",  done: step > 9  },
  ];
  const pct = Math.min(1, step / 10);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Panel title="INITIALIZING" titleCol={C.textSub} style={{ width: "clamp(280px, 55%, 440px)" }}>
        <div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ color: C.green, fontWeight: 700, letterSpacing: "0.2em", fontSize: "0.92em" }}>
              SALAT
            </div>
            <div style={{ color: C.textDim, fontSize: "0.72em", marginTop: 3 }}>
              v0.1.0 · Rust · Ratatui · Crossterm
            </div>
          </div>

          {steps.map((s, i) => {
            const active = i === Math.min(Math.floor(step / 2), steps.length - 1);
            return (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "3px 0",
                opacity: i > Math.floor(step / 2) ? 0.25 : 1,
              }}>
                <span style={{
                  color: s.done ? C.green : active ? C.yellow : C.textDim,
                  minWidth: 14, fontSize: "0.88em",
                }}>
                  {s.done ? "✓" : active ? (blink ? "▶" : " ") : "○"}
                </span>
                <span style={{
                  color: s.done ? C.text : active ? C.textSub : C.textDim,
                  fontSize: "0.88em",
                }}>
                  {s.label}{active && !s.done ? dots : ""}
                </span>
              </div>
            );
          })}

          <div style={{ marginTop: 14 }}>
            <Bar pct={pct} width={38} />
            <div style={{ color: C.textDim, fontSize: "0.72em", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(pct * 100)}% · Sétif, Algeria
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Prayer States Reference
// ══════════════════════════════════════════════════════════════════════════════

function StatesScreen({ size }: { size: TermSize }) {
  const small = size === "small";
  const blink = useBlink();

  const rows: {
    state: PrayerState;
    desc: string;
    visual?: React.ReactNode;
    bg: string;
    border: string;
  }[] = [
    {
      state: "upcoming",
      desc: "Prayer not yet reached. Time shown. No highlight.",
      bg: "transparent", border: C.border,
    },
    {
      state: "next",
      desc: "Immediately next. Highlighted green. Countdown visible.",
      visual: <span style={{ color: C.green, fontSize: "0.82em", fontVariantNumeric: "tabular-nums" }}>01:42:37</span>,
      bg: C.rowActive, border: C.green,
    },
    {
      state: "pre-adhan",
      desc: "Within notification window (configured minutes before). Yellow.",
      visual: <span style={{ color: C.yellow, fontSize: "0.82em" }}>12:47</span>,
      bg: C.yellowBg, border: C.yellow,
    },
    {
      state: "adhan",
      desc: "Prayer time reached. Full-screen overlay. Audio plays.",
      visual: <span style={{ color: C.red, opacity: blink ? 1 : 0.25 }}>◉ LIVE</span>,
      bg: C.redBg, border: C.red,
    },
    {
      state: "post-adhan",
      desc: "X minutes after Adhan. Mosque reminder displayed.",
      visual: <span style={{ color: C.red, fontSize: "0.82em" }}>+15m</span>,
      bg: C.redBg, border: C.redDim,
    },
    {
      state: "passed",
      desc: "Time elapsed. No action. Dimmed.",
      bg: "transparent", border: C.borderDim,
    },
    {
      state: "completed",
      desc: "User marked as completed. Green.",
      bg: C.greenBg, border: C.green,
    },
  ];

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <Crumb path="PRAYER STATE REFERENCE" hint="7 states" />

      {rows.map(({ state, desc, visual, bg, border }) => (
        <div key={state} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "9px 14px",
          background: bg,
          border: `1px solid ${border}`,
        }}>
          {/* State badge */}
          <div style={{ minWidth: small ? 80 : 110, fontWeight: 700 }}>
            <Badge state={state} />
          </div>
          {/* Prayer example */}
          {!small && (
            <div style={{ color: C.textSub, fontSize: "0.82em", minWidth: 90, fontVariantNumeric: "tabular-nums" }}>
              MAGHRIB · 19:21
            </div>
          )}
          {/* Description */}
          {!small && (
            <div style={{ color: C.textDim, fontSize: "0.82em", flex: 1 }}>
              {desc}
            </div>
          )}
          {/* Live visual */}
          <div style={{ marginLeft: "auto" }}>
            {visual}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TERMINAL EMULATOR WINDOW CHROME
// ══════════════════════════════════════════════════════════════════════════════

export function TerminalWindow({ children, size }: { children: React.ReactNode; size: TermSize }) {
  const dim = TERM_DIMS[size];
  return (
    <div style={{
      width: dim.w, height: dim.h,
      display: "flex", flexDirection: "column",
      background: C.winBg,
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid #0d0d20",
      boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px #1a1a3a",
      flexShrink: 0,
    }}>
      {/* Title bar */}
      <div style={{
        background: C.winTitle,
        padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid #0d0d20",
        flexShrink: 0, userSelect: "none",
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.dot1 }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.dot2 }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.dot3 }} />
        </div>
        <span style={{
          flex: 1, textAlign: "center",
          color: "#4a4a6a", fontSize: "0.78em", letterSpacing: "0.04em",
          fontFamily: "inherit",
        }}>
          salat — bash — {dim.label}
        </span>
        <span style={{ width: 45 }} />
      </div>

      {/* Terminal canvas */}
      <div style={{
        flex: 1, background: C.termBg,
        display: "flex", flexDirection: "column",
        overflow: "hidden", minHeight: 0,
      }}>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_LABELS: [Screen, string][] = [
  ["dashboard",      "DASHBOARD"],
  ["settings",       "SETTINGS"],
  ["prayer-config",  "PER-PRAYER"],
  ["status",         "STATUS"],
  ["notif-settings", "NOTIF"],
  ["location",       "LOCATION"],
  ["adhan-alert",    "ADHAN"],
  ["mosque-reminder","MOSQUE"],
  ["confirm",        "CONFIRM"],
  ["error",          "ERROR"],
  ["loading",        "LOADING"],
  ["states",         "STATES"],
];

export default function SalatTUI() {
  const [screen, setScreen]     = useState<Screen>("dashboard");
  const [termSize, setTermSize] = useState<TermSize>("large");

  const nav = useCallback((s: Screen) => setScreen(s), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!document.activeElement?.closest("[data-salat-tui]")) return;
      if (e.key === "1") nav("dashboard");
      if (e.key === "2") nav("settings");
      if (e.key === "3") nav("prayer-config");
      if (e.key === "4") nav("status");
      if (e.key === "Escape" && !["dashboard","settings","prayer-config","status"].includes(screen)) {
        nav("dashboard");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nav, screen]);

  const isOverlay = ["adhan-alert", "mosque-reminder"].includes(screen);

  return (
    <div
      data-salat-tui
      tabIndex={0}
      aria-label="Interactive simulated Salat terminal interface"
      style={{
      width: "100%", height: "100%",
      background: "#04060e",
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      color: C.text, fontSize: "13px", lineHeight: "1.45",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      overflowY: "auto", overflowX: "hidden",
      padding: "20px 16px 14px",
    }}>
      {/* Terminal size picker */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 12,
        alignItems: "center", fontSize: "0.72em",
      }}>
        <span style={{ color: C.textDim, marginRight: 4, letterSpacing: "0.1em" }}>TERMINAL SIZE</span>
        {(["large", "medium", "small"] as TermSize[]).map(s => (
          <button key={s} onClick={() => setTermSize(s)} style={{
            background: termSize === s ? C.borderHi : "none",
            border: `1px solid ${termSize === s ? C.borderHi : C.borderDim}`,
            color: termSize === s ? C.textBright : C.textDim,
            fontFamily: "inherit", fontSize: "inherit",
            padding: "3px 12px", cursor: "pointer", borderRadius: 0,
          }}>
            {TERM_DIMS[s].label}
          </button>
        ))}
      </div>

      {/* Terminal window */}
      <TerminalWindow size={termSize}>
        {!isOverlay && <TUIHeader size={termSize} />}

        {screen === "dashboard"      && <DashboardScreen size={termSize} />}
        {screen === "settings"       && <SettingsScreen onNav={nav} size={termSize} />}
        {screen === "prayer-config"  && <PrayerConfigScreen size={termSize} />}
        {screen === "status"         && <StatusScreen size={termSize} />}
        {screen === "notif-settings" && <NotifSettingsScreen size={termSize} />}
        {screen === "location"       && <LocationScreen size={termSize} />}
        {screen === "adhan-alert"    && <AdhanAlertScreen onDismiss={() => nav("dashboard")} />}
        {screen === "mosque-reminder"&& <MosqueReminderScreen onDismiss={() => nav("dashboard")} />}
        {screen === "confirm"        && <ConfirmScreen onBack={() => nav("settings")} />}
        {screen === "error"          && <ErrorScreen onBack={() => nav("location")} />}
        {screen === "loading"        && <LoadingScreen />}
        {screen === "states"         && <StatesScreen size={termSize} />}

        {!isOverlay && <TUIFooter screen={screen} onNav={nav} size={termSize} />}
      </TerminalWindow>

      {/* Prototype screen navigator (below terminal) */}
      <div style={{
        marginTop: 12,
        display: "flex", gap: 4, flexWrap: "wrap",
        justifyContent: "center", maxWidth: TERM_DIMS[termSize].w,
        fontSize: "0.72em",
      }}>
        <span style={{ color: C.textDim, marginRight: 4, alignSelf: "center" }}>SCREENS</span>
        {SCREEN_LABELS.map(([s, label]) => (
          <button key={s} onClick={() => setScreen(s)} style={{
            background: screen === s ? C.rowSel : "none",
            border: `1px solid ${screen === s ? C.border : C.borderDim}`,
            color: screen === s ? C.green : C.textDim,
            fontFamily: "inherit", fontSize: "inherit",
            cursor: "pointer", padding: "2px 8px", borderRadius: 0,
          }}>
            {label}
          </button>
        ))}
        <span style={{ color: C.textDim, marginLeft: 6, alignSelf: "center" }}>← prototype nav</span>
      </div>
    </div>
  );
}
