# Salat website

The official landing page for [Salat](https://github.com/linuxcoding-ADAM/Salat),
a keyboard-first prayer-time assistant for the Linux terminal.

Production target: <https://salat.ademmila.dev>

This repository holds only the website. The product, its documentation and its
releases live in the canonical repository,
<https://github.com/linuxcoding-ADAM/Salat>. Nothing here changes Salat itself.

## What is on the page

Hero with a copyable install command, Quick Mode and Full TUI, capabilities,
the Status screen, Adhan behaviour, architecture, install and platform
requirements, and links to the documentation, releases, issues and
contribution guide.

**Content rules.** Every claim comes from the Salat repository
(`README.md` and `docs/`). The two screenshots are real captures of Salat
v0.1.0 (`src/assets/`), and there is no simulated terminal output. Platform
statement: Linux x86_64 is the only supported platform; Linux ARM64 is
planned; native Windows and macOS are unsupported; WSL2 is not officially
supported. When Salat's documentation changes, update `src/content.ts` and the
sections to match.

## Stack

Vite, React 19 and TypeScript, with plain CSS. Fonts (JetBrains Mono,
Instrument Sans) are self-hosted through `@fontsource`, so the page makes no
third-party requests. There is no analytics and no cookie.

The design comes from a Figma Make project and keeps its layout, palette and
typography. The simulated interactive terminal in that design was left out, to
keep to real product output only.

## Development

Requires Node.js 20 or newer.

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # TypeScript, no emit
npm run build      # typecheck, then the production build in dist/
npm run preview    # serve dist/ locally
```

```
index.html            metadata (title, description, Open Graph, Twitter)
public/               favicon, og-image.png, robots.txt, sitemap.xml
src/content.ts        links, version, feature and stack data
src/components/       shared UI, navigation, footer
src/sections/         one file per page section
src/assets/           Salat v0.1.0 screenshots
src/index.css         all styles
vercel.json           build settings and security headers
```

When Salat releases a new version, update `VERSION` in `src/content.ts`, and
replace the screenshots only with new real captures.

## Deployment (Vercel)

The project builds as a static site, so no server configuration is needed.

1. Import this repository as a new Vercel project. The framework preset is
   Vite, the build command is `npm run build` and the output directory is
   `dist` (already set in `vercel.json`).
2. In the project's *Settings → Domains*, add `salat.ademmila.dev`.
3. At the DNS provider for `ademmila.dev`, add the record Vercel shows for that
   subdomain (normally a `CNAME` for `salat` pointing at Vercel). Add only
   this one record: the root domain and the existing portfolio stay
   untouched.
4. Wait for Vercel to verify the domain and issue the certificate.

## License

[MIT](LICENSE). Salat itself is dual-licensed under MIT OR Apache-2.0. The
bundled fonts are under the SIL Open Font License.
