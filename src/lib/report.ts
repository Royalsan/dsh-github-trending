/**
 * Report orchestration: scrape -> enrich -> analyse -> render, with a small
 * in-process cache so the panel, the `/github-trending` command and the tool can
 * share one fetch and the network is hit at most once per TTL window.
 */

import { analyzeRepos } from './analyze.js'
import type { AnalyzedRepo } from './analyze.js'
import { enrichRepos } from './enrich.js'
import { buildMermaid, buildSummary } from './render.js'
import type { MermaidChart, ReportSummary } from './render.js'
import { fetchTrending, normalizeSince, slugForLanguage } from './trending.js'
import type { TrendingSince } from './trending.js'

export interface ReportOptions {
  since?: unknown
  language?: unknown
  limit?: unknown
  focusCount?: unknown
  refresh?: unknown
  token?: string | null
  signal?: AbortSignal
  timeoutMs?: number
}

export interface TrendingReport {
  since: TrendingSince
  language: string | null
  generatedAt: string
  repos: AnalyzedRepo[]
  summary: ReportSummary
  mermaid: MermaidChart[]
  focusCount: number
  cache: 'fresh' | 'hit'
  durationMs: number
}

const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE = new Map<string, { at: number; report: TrendingReport }>()
const INFLIGHT = new Map<string, Promise<TrendingReport>>()

export function clearReportCache(): void {
  CACHE.clear()
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function truthy(value: unknown): boolean {
  if (value === true) return true
  const raw = String(value ?? '').toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

function cacheKey(since: TrendingSince, language: string | null, limit: number, focusCount: number): string {
  return `${since}|${language ?? '*'}|${limit}|${focusCount}`
}

export function reportQuery(options: ReportOptions): { since: TrendingSince; language: string | null; limit: number; focusCount: number } {
  const since = normalizeSince(options.since)
  const language = slugForLanguage(options.language) || null
  const limit = clampInt(options.limit, 15, 3, 25)
  const focusCount = clampInt(options.focusCount, 3, 1, 6)
  return { since, language, limit, focusCount }
}

export async function getReport(options: ReportOptions = {}): Promise<TrendingReport> {
  const { since, language, limit, focusCount } = reportQuery(options)
  const key = cacheKey(since, language, limit, focusCount)
  const now = Date.now()

  if (!truthy(options.refresh)) {
    const cached = CACHE.get(key)
    if (cached && now - cached.at < CACHE_TTL_MS) {
      return { ...cached.report, cache: 'hit' }
    }
    const inflight = INFLIGHT.get(key)
    if (inflight) return inflight
  }

  const task = (async (): Promise<TrendingReport> => {
    const started = Date.now()
    const trending = await fetchTrending({
      since,
      language,
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? 20000,
    })
    const sliced = trending.slice(0, limit)
    const facts = await enrichRepos(sliced, {
      token: options.token,
      readmeCount: Math.min(8, focusCount + 3),
      concurrency: 4,
      budgetMs: 12000,
      signal: options.signal,
    })
    const repos = analyzeRepos(sliced, facts, { since, focusCount })
    const generatedAt = new Date().toISOString()
    const summary = buildSummary(repos)
    const mermaid = buildMermaid(repos, summary)
    const report: TrendingReport = {
      since,
      language,
      generatedAt,
      repos,
      summary,
      mermaid,
      focusCount,
      cache: 'fresh',
      durationMs: Date.now() - started,
    }
    CACHE.set(key, { at: Date.now(), report })
    return report
  })()

  INFLIGHT.set(key, task)
  try {
    return await task
  } finally {
    INFLIGHT.delete(key)
  }
}