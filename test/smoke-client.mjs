#!/usr/bin/env node
/**
 * Client-side smoke test: loads client.js through a fake __ModuleLoader__,
 * mounts the panel component with a minimal React shim and asserts that the
 * rendered markup contains the report data. No browser required.
 *
 * Usage: node test/smoke-client.mjs [daily|weekly|monthly] [language]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getReport } from '../lib/report.js'
import { React, mount } from './react-shim.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const since = process.argv[2] ?? 'daily'
const language = process.argv[3] ?? null

const slots = []
const locales = []
const captured = {}

globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      captured.definition = definition
      captured.module = definition.factory((id) => {
        if (id === 'react') return React
        throw new Error(`unexpected require: ${id}`)
      })
    },
  },
}

let report
try {
  report = await getReport({ since, language, limit: 12, focus: 3, refresh: false })
} catch (error) {
  // GitHub may be unreachable from this machine while the running Harness still
  // holds a cached report, so ride the plugin's own HTTP route as a fallback.
  const query = new URLSearchParams({ since })
  if (language) query.set('language', language)
  const url = `http://127.0.0.1:54381/dsh-github-trending/report?${query}`
  console.warn(`live fetch failed (${error.message}); falling back to ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw error
  report = await response.json()
}
const payload = { ...report }
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
})

await import(pathToFileURL(resolve(root, 'client.js')).href)

const mod = captured.module
if (!mod) {
  console.error('client module did not register through __ModuleLoader__')
  process.exit(1)
}

const ctx = {
  slots: {
    inject(key, cb) {
      cb()
      return () => {}
    },
    register(config, component) {
      slots.push({ config, component })
      return () => {}
    },
  },
  get(name) {
    if (name === 'locale') {
      return {
        register(ns, dict) {
          locales.push({ ns, dict })
        },
        bind: () => (key) => key,
      }
    }
    return undefined
  },
}

mod.apply(ctx)

const failures = []
const check = (ok, label, detail = '') => {
  if (ok) console.log(`  ok   ${label}`)
  else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
    failures.push(label)
  }
}

const navEntry = slots.find((entry) => entry.config?.name === 'sidebar.panellist')
const panel = slots.find((entry) => entry.config?.name === 'main')

check(Boolean(navEntry), 'sidebar.panellist registered')
check(navEntry?.config?.id === 'github-trending', 'sidebar entry id', String(navEntry?.config?.id))
check(Boolean(panel), 'main panel registered')
check(locales.length >= 2, 'locale dictionaries registered', String(locales.length))

if (!panel) {
  console.error('\nclient smoke failed: panel missing')
  process.exit(1)
}

const html = await mount(React.createElement(panel.component, {}))

const first = report.repos[0]
const visibleRepos = report.repos.slice(0, 6)
check(visibleRepos.every((repo) => html.includes(repo.fullName)), 'renders first page of repos')
check(Boolean(first) && html.includes(first.fullName), 'renders top repo', String(first?.fullName))
check(/刷新|Refresh/.test(html), 'renders refresh control')
check(!/导出 Markdown|Export Markdown|dsh-github-trending\/export/.test(html), 'panel has no export control')
check(!/正在抓取|Loading/.test(html), 'loading state replaced by data')
check(html.length > 8000, 'markup size', String(html.length))
check(!/undefined|NaN/.test(html), 'no undefined/NaN in markup')
check((html.match(/class="gt-repo"/g) || []).length >= 5, 'renders repo cards', String((html.match(/gt-repo"/g) || []).length))
check((html.match(/class="gt-block"/g) || []).length === (html.match(/class="gt-repo"/g) || []).length, 'analysis rendered inline per card')
check(!/查看分析|gt-card-more|gt-bar-row|Mermaid/.test(html), 'no fold-out toggle, bar chart or mermaid source')

mkdirSync(resolve(here, 'out'), { recursive: true })
writeFileSync(resolve(here, 'out', `panel-${since}${language ? `-${language}` : ''}.html`), html)

console.log('')
if (failures.length) {
  console.log(`client smoke failed: ${failures.length} check(s)`)
  process.exit(1)
}
console.log(`client smoke ok: ${report.repos.length} repos, ${html.length} chars of markup`)