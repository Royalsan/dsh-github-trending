# GitHub Trending Radar · dsh-github-trending

[中文](README.md) · [English](README.en.md)

A long-lived Cordis plugin for DeepSeek Harness: it scrapes GitHub Trending (daily / weekly / monthly, optionally filtered
by programming language), runs a structured analysis on every repository (summary, star growth, tech stack, highlights,
risks), and renders the result as a browsable, pageable, filterable card report inside the Harness Web UI. It also
registers a tool, a slash command and an HTTP route.

> About "dsh-genui": no package or service named `dsh-genui` exists in this Harness build (verified against all 199 live
> configuration entries and the host/client service catalog). The plugin therefore ships its own generative-UI layer: the
> host returns structured report data, and the client injects a `sidebar.panellist` entry plus a `main` panel whose React
> component renders the cards. The result is equivalent to a genui card page without depending on anything uninstalled.

![GitHub Trending radar panel](docs/panel-daily.png)

## Features

- **Trending scraping**: `daily` / `weekly` / `monthly`, 23 common languages; parses total stars, forks, period gain, contributors and language color.
- **Structured analysis** (deterministic rules, no extra model calls):
  - project summary (official description plus a cleaned README excerpt)
  - star gain, period growth ratio, average stars per day, base-size comparison
  - inferred stack (language ecosystem, topic-to-technology mapping, name/description/README keywords)
  - highlights (rank, momentum, scale, category, contributors, license, activity)
  - risks with a severity level (small base, overheated growth, very new project, archived, missing license, issue backlog,
    single-maintainer risk, missing information)
  - category (AI/LLM, developer tooling, Web, infrastructure, data, security, mobile, blockchain, learning, productivity, other)
- **Interactive report panel**: the "GitHub Trending" sidebar icon opens a main panel with KPI tiles, a period switch, a
  language selector, search, category chips and paginated repo cards (6 per page; each card shows the owner avatar, rank,
  description, metrics, tags and the full analysis inline). The panel intentionally omits the bar chart, the standalone
  deep-dive section, chart source and any download entry.
- **Report data**: Mermaid source for a `xychart-beta` gain chart and a `pie` share chart travels with the structured data
  returned by `GET /dsh-github-trending/report`, for scripts and re-rendering; the panel itself does not display it.
- **Multiple entry points**: the `github_trending` tool, the `/github-trending [daily|weekly|monthly] [language]` command and
  `GET /dsh-github-trending/report`.

## Install

Install this directory as a bundle in DSH:

```text
plugin_manager(action="install_bundle", target="<absolute path>/dsh-github-trending")
```

The install writes the package into the profile's `package.json` and `cordis.patch.yml`
(`- insert: - id: dsh-github-trending`) and takes effect in the Harness Web UI: a "GitHub Trending" sidebar entry appears,
`github_trending` shows up in the tool list, and `/github-trending` in the command palette.

You can also mount it as an ordinary Cordis plugin by hand; see `cordis.yml`.

Installing straight from GitHub (the repository root is the package root, and no build step is required):

```text
plugin_manager(action="install_bundle", target="github:Royalsan/dsh-github-trending")
```

## Configuration

`apply(ctx, config)` accepts these fields (all optional):

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `token` | string | `$GITHUB_TOKEN` / `$GH_TOKEN` | Optional GitHub token that raises the API quota (60 requests/hour unauthenticated). **Never commit a token**; pass it through the environment |
| `defaultSince` | `daily`\|`weekly`\|`monthly` | `daily` | Period used when the tool or command omits one |
| `defaultLimit` | number | `15` | Repositories to scrape (3–25) |
| `defaultFocus` | number | `3` | Repositories that get the extended deep-dive (1–6) |

Set them under `config:` in `cordis.yml` or the bundle patch; prefer an environment variable for `token`.

## Usage

```text
/github-trending                       # today, all languages
/github-trending weekly rust           # this week, Rust
```

The equivalent tool call:

```json
{ "since": "weekly", "language": "rust", "limit": 20, "focus": 4, "refresh": false }
```

HTTP route (same origin, used by the panel and by scripts):

```text
GET /dsh-github-trending/report?since=daily&language=&limit=15&focus=3&refresh=0
```

It returns the report as JSON: `since` / `language` / `generatedAt` / `repos[]` (with analysis fields) / `summary` / `mermaid`.

Caching: reports for 10 minutes (concurrent requests for the same period are coalesced) and GitHub API facts for 6 hours.
After a 403/429 the enrichment step is skipped for 5 minutes and the panel keeps rendering from the Trending page alone.

## Layout

```
index.js            host side: tool, command, HTTP routes (registered in apply, disposed via ctx.effect)
client.js           client side: sidebar.panellist icon + main panel component (window.__ModuleLoader__)
lib/trending.js     GitHub Trending HTML fetching and parsing
lib/http.js         transport: direct fetch with a Harness web-service fallback
lib/enrich.js       GitHub API + README enrichment (concurrency pool, cache, rate-limit cooldown)
lib/analyze.js      categories, stack, highlights, risks, deep-dive copy
lib/render.js       summary and Mermaid chart builders
lib/report.js       orchestration, cache, argument normalization
src/                TypeScript sources (one-to-one with the .js files)
build.mjs           emits .js via node:module stripTypeScriptTypes
test/               host and client smoke tests, preview page and layout metrics collection
```

## Development

```powershell
node build.mjs                 # src/**.ts -> sibling .js
node test/smoke-host.mjs daily # host: tool/command/route end to end
node test/smoke-client.mjs daily rust   # client: render the panel through a React shim and assert
node test/make-preview.mjs daily        # wrap the panel snapshot into a standalone preview page
node test/collect-metrics.mjs           # second terminal: collect the layout metrics the preview posts back
node test/measure-panel.mjs daily       # or all at once: start the collector and a headless browser
```

`test/out/` receives the panel HTML snapshots, layout metrics and preview images (`panel-*.html` / `panel-*.png`) for
offline layout checks. The preview page renders with fallback `--dsw-alias-*` values so it does not need the Harness shell,
and its self-check reports `overflowX`, card columns and KPI counts to catch horizontal overflow.

## Notes

- Data comes from the `github.com/trending` page; the number of rows varies with GitHub's response (usually 10–16).
- The star gain is the period gain GitHub reports. Analysis text is rule-generated to speed up triage and is not a
  recommendation.
- The unauthenticated API quota is low, so enrichment degrades gracefully: only topics/license/issues/README extras are
  missing; the ranking and growth numbers are unaffected.
- On a restricted network, when a direct connection to `github.com` fails the plugin falls back to the Harness web
  transport (`ctx.web.fetch`).

## License

MIT, see [LICENSE](LICENSE).