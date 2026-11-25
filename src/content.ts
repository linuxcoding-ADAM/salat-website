export const GITHUB = "https://github.com/linuxcoding-ADAM/Salat";
export const GITLAB = "https://gitlab.com/linuxcoding-ADAM/salat";
export const RELEASES = `${GITHUB}/releases/latest`;
export const ISSUES = `${GITHUB}/issues`;
export const DOCS = `${GITHUB}/tree/main/docs`;
export const CONTRIBUTING = `${GITHUB}/blob/main/CONTRIBUTING.md`;
export const LICENSE = `${GITHUB}/blob/main/LICENSE`;
export const VERSION = "v0.1.0";
export const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/linuxcoding-ADAM/Salat/main/install.sh | sh";

export const features = [
  ["01", "Prayer data", "Fetches ISO-8601 prayer times from AlAdhan and caches the API’s answers locally. Salat has no prayer-calculation engine of its own."],
  ["02", "Per-prayer control", "Set before and after reminder windows, desktop notifications, and Adhan playback for each prayer."],
  ["03", "Reliable scheduling", "Compares absolute wall-clock times on a one-second tick and records every fired event, so a restart does not fire it again."],
  ["04", "Offline city search", "Searches a city index embedded in the binary, with no network connection."],
  ["05", "System status", "Reports ten components, each as healthy, degraded, down or unknown, never a false “OK”."],
  ["06", "Linux native", "Runs in the foreground, or headless as a systemd user service. No account, no browser. See the known issues for the v0.1.0 unit."],
] as const;

export const stack = [
  ["LANGUAGE", "Rust", "systems implementation"],
  ["TUI", "Ratatui", "terminal interface rendering"],
  ["TERMINAL", "Crossterm", "terminal input and control"],
  ["ASYNC", "Tokio", "scheduler and async work"],
  ["STORAGE", "SQLite", "prayer-day cache and event records"],
  ["PRAYER DATA", "AlAdhan", "remote prayer-time source"],
  ["PLATFORM", "Linux", "terminal, D-Bus, systemd"],
] as const;

export const flow = [
  "AlAdhan API",
  "Prayer domain",
  "SQLite cache",
  "Scheduler",
  "TUI · notifications · Adhan",
] as const;
