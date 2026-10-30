// Generated from src/lib/report.ts - do not edit by hand; run `node build.mjs`.
/**
 * Report orchestration: scrape -> enrich -> analyse -> render, with a small
 * in-process cache so the panel, the `/github-trending` command and the tool can
 * share one fetch and the network is hit at most once per TTL window.
 */

import { analyzeRepos } from './analyze.js'
                                                
import { enrichRepos } from './enrich.js'
import { buildMermaid, buildSummary } from './render.js'
                                                              
import { fetchTrending, normalizeSince, slugForLanguage } from './trending.js'
                                                  

                                
                 
                    
                 
                      
                   
                       
                      
                    
 

                                 
                      
                         
                     
                       
                        
                         
                    
                        
                    
 

const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE = new Map                                                ()
const INFLIGHT = new Map                                 ()

export function clearReportCache()       {
  CACHE.clear()
}

function clampInt(value         , fallback        , min        , max        )         {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function truthy(value         )          {
  if (value === true) return true
  const raw = String(value ?? '').toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

function cacheKey(since               , language               , limit        , focusCount        )         {
  return `${since}|${language ?? '*'}|${limit}|${focusCount}`
}

export function reportQuery(options               )                                                                                       {
  const since = normalizeSince(options.since)
  const language = slugForLanguage(options.language) || null
  const limit = clampInt(options.limit, 15, 3, 25)
  const focusCount = clampInt(options.focusCount, 3, 1, 6)
  return { since, language, limit, focusCount }
}

export async function getReport(options                = {})                          {
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

  const task = (async ()                          => {
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
    const report                 = {
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