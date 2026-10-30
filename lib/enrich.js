// Generated from src/lib/enrich.ts - do not edit by hand; run `node build.mjs`.
/**
 * Optional enrichment through the public GitHub REST API.
 *
 * Trending HTML only carries stars / forks / language / description. Topics,
 * licence, age, issue pressure and a README excerpt make the analysis much more
 * substantive, but the unauthenticated API is limited to 60 requests per hour —
 * so every call is cached, bounded by a deadline, and every failure degrades to
 * "no enrichment" instead of failing the report.
 */

import { fetchText } from './http.js'
                                                 
import { cleanText } from './trending.js'

                            
                  
                   
                  
                        
                   
                          
                         
                           
                         
                              
                     
 

                                
                       
                      
                      
                   
                      
 

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const CACHE = new Map                                          ()

/** After a 403/429 the whole enrichment phase is skipped for a few minutes. */
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000
let RATE_LIMITED_UNTIL = 0

export function clearEnrichCache()       {
  CACHE.clear()
  RATE_LIMITED_UNTIL = 0
}

export function emptyFacts(fullName        , note                = null)            {
  return {
    fullName,
    enriched: false,
    topics: [],
    license: null,
    archived: false,
    createdAt: null,
    pushedAt: null,
    openIssues: null,
    homepage: null,
    readmeSnippet: null,
    note,
  }
}

function githubToken(explicit                )         {
  const token = explicit || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
  return String(token).trim()
}

function authHeaders(token        )                         {
  const headers                         = {
    'user-agent': 'dsh-github-trending/1.0',
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

class RateLimitedError extends Error {}

async function getJson(url        , token        , timeoutMs        , signal              )               {
  const response = await fetchText(url, { headers: authHeaders(token), signal, timeoutMs })
  if (response.status === 403 || response.status === 429) {
    throw new RateLimitedError(`GitHub API rate limit reached (HTTP ${response.status}, via ${response.via})`)
  }
  if (response.status !== 200) throw new Error(`GitHub API HTTP ${response.status} via ${response.via}`)
  try {
    return JSON.parse(response.text)
  } catch {
    throw new Error(`GitHub API returned non-JSON via ${response.via}`)
  }
}

function shorten(text        , max        )         {
  const value = text.trim()
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。'), cut.lastIndexOf('\n'))
  return `${(stop > max * 0.5 ? cut.slice(0, stop + 1) : cut).trim()}…`
}

function readmeToSnippet(markdown        )         {
  const lines = String(markdown ?? '').split(/\r?\n/)
  const kept           = []
  let inFence = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (!trimmed) continue
    if (/^\[!\[/.test(trimmed)) continue
    if (/^!\[/.test(trimmed)) continue
    if ((trimmed.match(/\]\(/g) || []).length >= 3) continue // navigation / table-of-contents line
    if (/^<\/?(p|div|img|a|h\d|br|table|tr|td|th|center|picture|source|details|summary)\b/i.test(trimmed)) continue
    if (/^<[^>]+>$/.test(trimmed)) continue
    if (/^\|/.test(trimmed)) continue
    if (/^[-=*_]{3,}$/.test(trimmed)) continue
    if (/^#{1,6}\s*$/.test(trimmed)) continue
    if (/^(badge|shields\.io)/i.test(trimmed)) continue
    if (/^(docs|documentation|license|contributing|sponsor)\b/i.test(trimmed) && trimmed.length < 40) continue
    kept.push(trimmed.replace(/^#{1,6}\s*/, ''))
    if (kept.join(' ').length > 1400) break
  }
  const text = cleanText(kept.join(' '))
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return shorten(text, 520)
}

async function fetchReadme(fullName        , timeoutMs        , signal              )                         {
  const url = `https://raw.githubusercontent.com/${fullName}/HEAD/README.md`
  try {
    const response = await fetchText(url, {
      headers: { 'user-agent': 'dsh-github-trending/1.0' },
      signal,
      timeoutMs,
    })
    if (response.status !== 200) return null
    const body = response.text
    if (!body) return null
    return body.slice(0, 200000)
  } catch {
    return null
  }
}

async function enrichOne(
  repo              ,
  options               ,
  token        ,
  withReadme         ,
  deadline        ,
)                     {
  const cached = CACHE.get(repo.fullName)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.facts

  const facts = emptyFacts(repo.fullName)
  const remaining = Math.max(1500, deadline - Date.now())
  try {
    const payload = await getJson(
      `https://api.github.com/repos/${repo.fullName}`,
      token,
      Math.min(8000, remaining),
      options.signal,
    )
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.topics)) facts.topics = payload.topics.map((item         ) => String(item)).filter(Boolean)
      if (payload.license && payload.license.spdx_id) facts.license = String(payload.license.spdx_id)
      facts.archived = payload.archived === true
      facts.createdAt = payload.created_at ? String(payload.created_at) : null
      facts.pushedAt = payload.pushed_at ? String(payload.pushed_at) : null
      facts.openIssues = typeof payload.open_issues_count === 'number' ? payload.open_issues_count : null
      facts.homepage = payload.homepage ? String(payload.homepage) : null
      facts.enriched = true
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    facts.note = message
    CACHE.set(repo.fullName, { at: Date.now(), facts })
    throw error instanceof RateLimitedError ? error : null
  }

  if (withReadme && deadline - Date.now() > 2000) {
    const markdown = await fetchReadme(repo.fullName, Math.min(6000, Math.max(1500, deadline - Date.now())), options.signal)
    if (markdown) {
      const snippet = readmeToSnippet(markdown)
      facts.readmeSnippet = snippet || null
    }
  }

  CACHE.set(repo.fullName, { at: Date.now(), facts })
  return facts
}

/**
 * Enriches repositories with a bounded worker pool. Returns a map keyed by
 * `owner/name`; repositories that could not be enriched get an empty record.
 */
export async function enrichRepos(repos                , options                = {})                                  {
  const results = new Map                   ()

  if (Date.now() < RATE_LIMITED_UNTIL) {
    for (const repo of repos) results.set(repo.fullName, emptyFacts(repo.fullName, 'github api rate limited (cooldown)'))
    return results
  }

  const token = githubToken(options.token)
  const concurrency = Math.max(1, Math.min(6, options.concurrency ?? 4))
  const readmeCount = Math.max(0, options.readmeCount ?? 8)
  const deadline = Date.now() + Math.max(2000, options.budgetMs ?? 12000)
  const queue = repos.map((repo, index) => ({ repo, index }))
  let stopped                = null

  const worker = async ()                => {
    for (;;) {
      const next = queue.shift()
      if (!next) return
      if (stopped) {
        results.set(next.repo.fullName, emptyFacts(next.repo.fullName, stopped))
        continue
      }
      if (Date.now() > deadline) {
        results.set(next.repo.fullName, emptyFacts(next.repo.fullName, 'enrichment budget exhausted'))
        continue
      }
      const withReadme = next.index < readmeCount
      try {
        const facts = await enrichOne(next.repo, options, token, withReadme, deadline)
        results.set(next.repo.fullName, facts)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.set(next.repo.fullName, emptyFacts(next.repo.fullName, message))
        if (error instanceof RateLimitedError || /rate limit/i.test(message)) stopped = message
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  if (stopped && /rate limit/i.test(stopped)) RATE_LIMITED_UNTIL = Date.now() + RATE_LIMIT_COOLDOWN_MS

  for (const repo of repos) {
    if (!results.has(repo.fullName)) results.set(repo.fullName, emptyFacts(repo.fullName, 'not enriched'))
  }
  return results
}