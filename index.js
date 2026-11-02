// Generated from src/index.ts - do not edit by hand; run `node build.mjs`.
/**
 * @royalsan/dsh-github-trending — Host half.
 *
 * Registers:
 *   - tool `github_trending`      : fetch + analyse + digest for the model
 *   - command `/github-trending`  : user-facing one-shot report
 *   - HTTP `GET /dsh-github-trending/report` : JSON feed for the Web panel
 *
 * The Web panel lives in client.ts and reads the JSON feed over the same origin.
 */

import { getReport, reportQuery } from './lib/report.js'
                                                     
import { registerTextBackend } from './lib/http.js'
import { PERIOD_EN, PERIOD_ZH, POPULAR_LANGUAGES } from './lib/trending.js'
                                                      

/**
 * Hard dependency: the tool registry. Commands and the HTTP server are optional
 * capabilities resolved through `ctx.get()` so the plugin still loads in hosts
 * that do not expose them.
 */
export const inject = ['tools']

                                   
                                                                              
                
                                                    
                       
                                                            
                       
                                                             
                       
 

                      
          
 

                           
                                                       
                             
                                        
                                                                                                               
 

const ROUTE_BASE = '/dsh-github-trending'
const RISK_ICON                         = { high: '🔴', medium: '🟠', low: '🟢' }

const SETTINGS = {
  token: null                 ,
  defaultLimit: 15,
  defaultFocus: 3,
  defaultSince: 'daily'                 ,
}

function clampInt(value         , fallback        , min        , max        )         {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function compact(value        )         {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 10000) return `${(value / 1000).toFixed(1)}k`
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function range(value        )         {
  const pct = value * 100
  if (pct >= 10) return `${pct.toFixed(0)}%`
  if (pct >= 1) return `${pct.toFixed(1)}%`
  return `${pct.toFixed(2)}%`
}

function safeGet(ctx                 , name        )      {
  try {
    return typeof ctx.get === 'function' ? ctx.get(name) : undefined
  } catch {
    return undefined
  }
}

function logInfo(ctx                 , message        )       {
  try {
    ctx.logger?.info?.(`[github-trending] ${message}`)
  } catch {
    /* logging must never break the feature */
  }
}

function reportPath(options                                                                       )         {
  const { since, language, limit, focusCount } = reportQuery({
    since: options.since,
    language: options.language,
    limit: options.limit,
    focusCount: options.focus,
  })
  const params = new URLSearchParams({ since, limit: String(limit), focus: String(focusCount) })
  if (language) params.set('language', language)
  return `${ROUTE_BASE}/report?${params.toString()}`
}

/** Public JSON payload: the report as the panel and scripts consume it. */
function toPublicReport(report                )                          {
  return { ...report }
}

function digestText(report                )         {
  const { summary, repos, since } = report
  const periodZh = PERIOD_ZH[since]
  const lines           = []
  lines.push(
    `GitHub Trending · ${periodZh}榜 · ${report.language ?? '全部语言'} · 收录 ${summary.repoCount} 个仓库` +
      `（生成于 ${report.generatedAt.replace('T', ' ').slice(0, 16)} UTC，耗时 ${(report.durationMs / 1000).toFixed(1)}s，${report.cache === 'hit' ? '缓存命中' : '实时抓取'}）`,
  )
  lines.push(
    `周期 star 增量 +${compact(summary.totalDelta)} ｜ 累计 star ${compact(summary.totalStars)} ｜ 最热语言 ${summary.topLanguage} ｜ 平均增长率 ${range(summary.avgGrowth)}`,
  )
  lines.push(
    `风险分布：高 ${summary.riskCount.high} / 中 ${summary.riskCount.medium} / 低 ${summary.riskCount.low} ｜ 结构化增强 ${summary.enrichedCount}/${summary.repoCount}（GitHub API）`,
  )
  lines.push('')
  for (const repo of repos.slice(0, 8)) {
    lines.push(
      `${repo.rank}. ${repo.fullName} +${compact(repo.delta)} star（累计 ${compact(repo.stars)}）· ${repo.categoryZh} · ${RISK_ICON[repo.riskLevel]} ${range(repo.growthRatio)}`,
    )
  }
  if (repos.length > 8) lines.push(`… 其余 ${repos.length - 8} 个仓库见报告`)
  lines.push('')
  lines.push(`交互式卡片报告：Harness 侧边栏「GitHub 趋势」面板（数据源 ${reportPath({ since, language: report.language, limit: repos.length, focus: report.focusCount })}）`)
  return lines.join('\n')
}

function toolDefinition()          {
  return {
    name: 'github_trending',
    description:
      'Fetch the GitHub Trending board (daily / weekly / monthly, optionally filtered by programming language), analyse every repository ' +
      '(summary, star gain, tech stack, highlights, risks) and render an interactive card report in the Harness Web UI sidebar panel. ' +
      'Returns a compact digest: totals, top repositories and the path of the JSON feed. Results are cached for 10 minutes.',
    parameters: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Board period. daily = stars today, weekly = stars this week, monthly = stars this month. Defaults to daily.',
        },
        language: {
          type: 'string',
          description: 'Programming language filter, e.g. "python", "rust", "typescript". Omit or leave empty for all languages.',
        },
        limit: {
          type: 'integer',
          minimum: 3,
          maximum: 25,
          description: 'How many repositories to include in the report (default 15).',
        },
        focus: {
          type: 'integer',
          minimum: 1,
          maximum: 6,
          description: 'How many top repositories get a deep-dive breakdown (default 3).',
        },
        refresh: {
          type: 'boolean',
          description: 'Bypass the 10 minute cache and re-scrape now.',
        },
      },
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          since: { type: 'string' },
          language: { type: 'string' },
          generatedAt: { type: 'string' },
          cache: { type: 'string' },
          repoCount: { type: 'integer' },
          totalDelta: { type: 'integer' },
          totalStars: { type: 'integer' },
          repos: { type: 'array', items: { type: 'object', additionalProperties: true } },
          reportPath: { type: 'string' },
        },
        additionalProperties: true,
      },
      render(_args         , value         )                                        {
        const record = (value ?? {})                       
        const repos        = Array.isArray(record.repos) ? record.repos : []
        const lines           = []
        lines.push(
          `GitHub Trending · ${PERIOD_ZH[record.since                 ] ?? record.since}榜 · ${record.language || '全部语言'} · 收录 ${record.repoCount ?? repos.length} 个仓库`,
        )
        lines.push(
          `周期 star 增量 +${compact(Number(record.totalDelta) || 0)} ｜ 累计 star ${compact(Number(record.totalStars) || 0)} ｜ ${record.cache === 'hit' ? '缓存命中' : '实时抓取'}`,
        )
        lines.push('')
        for (const repo of repos.slice(0, 8)) {
          lines.push(
            `${repo.rank}. ${repo.fullName} +${compact(Number(repo.delta) || 0)} star（累计 ${compact(Number(repo.stars) || 0)}）· ${repo.category ?? ''} · ${RISK_ICON[String(repo.riskLevel)] ?? ''}`,
          )
        }
        lines.push('')
        lines.push(`交互式报告：Harness 侧边栏「GitHub 趋势」面板`)
        if (record.reportPath) lines.push(`JSON 数据：${record.reportPath}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 60000,
    isConcurrencySafe: true,
    async execute(args         , exec         )                   {
      const input = (args ?? {})                           
      const signal = (exec                                        )?.signal
      const report = await getReport({
        since: input.since ?? SETTINGS.defaultSince,
        language: input.language,
        limit: input.limit ?? SETTINGS.defaultLimit,
        focusCount: input.focus ?? SETTINGS.defaultFocus,
        refresh: input.refresh,
        token: SETTINGS.token,
        signal,
      })
      return {
        since: report.since,
        language: report.language ?? '',
        generatedAt: report.generatedAt,
        cache: report.cache,
        repoCount: report.summary.repoCount,
        totalDelta: report.summary.totalDelta,
        totalStars: report.summary.totalStars,
        summary: report.summary,
        repos: report.repos.map((repo) => ({
          rank: repo.rank,
          fullName: repo.fullName,
          url: repo.url,
          stars: repo.stars,
          delta: repo.delta,
          growthRatio: repo.growthRatio,
          language: repo.language,
          category: repo.categoryZh,
          riskLevel: repo.riskLevel,
          risk: repo.risks,
          highlights: repo.highlights,
          stack: repo.stack,
          tldr: repo.tldr,
        })),
        reportPath: reportPath({ since: report.since, language: report.language, limit: report.summary.repoCount, focus: report.focusCount }),
      }
    },
  }
}

function commandDefinition(ctx                 )          {
  return {
    name: 'github-trending',
    description: '抓取 GitHub Trending（日/周/月 + 语言筛选）并生成交互式趋势报告',
    input: { hint: '[daily|weekly|monthly] [language]', attachments: false },
    async handler(invocation                                             )                                                       {
      const raw = String(invocation.rawInput ?? '').trim()
      const tokens = raw.split(/\s+/).filter(Boolean)
      let since         = SETTINGS.defaultSince
      let language = ''
      for (const token of tokens) {
        const lower = token.toLowerCase()
        if (/^(daily|weekly|monthly|day|week|month)$/.test(lower)) since = lower.startsWith('w') ? 'weekly' : lower.startsWith('m') ? 'monthly' : 'daily'
        else if (!language) language = token
      }
      try {
        const report = await getReport({
          since,
          language,
          limit: SETTINGS.defaultLimit,
          focusCount: SETTINGS.defaultFocus,
          token: SETTINGS.token,
          signal: invocation.signal,
        })
        logInfo(ctx, `command report ${report.since}/${report.language ?? '*'} in ${report.durationMs}ms`)
        return { kind: 'success', text: digestText(report) }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { kind: 'error', text: `GitHub Trending 抓取失败：${message}` }
      }
    },
  }
}

function sendJson(res     , status        , payload         )       {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-length', Buffer.byteLength(body))
  res.end(body)
}

function queryOf(req     )                         {
  try {
    const url = new URL(String(req.url ?? '/'), 'http://localhost')
    const out                         = {}
    url.searchParams.forEach((value, key) => {
      out[key] = value
    })
    return out
  } catch {
    return {}
  }
}

function reportRoute(ctx                 )          {
  return {
    kind: 'exact',
    path: `${ROUTE_BASE}/report`,
    async handler(req     , res     )                {
      const query = queryOf(req)
      try {
        const report = await getReport({
          since: query.since,
          language: query.language,
          limit: query.limit ?? SETTINGS.defaultLimit,
          focusCount: query.focus ?? SETTINGS.defaultFocus,
          refresh: query.refresh,
          token: SETTINGS.token,
        })
        sendJson(res, 200, toPublicReport(report))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        sendJson(res, 502, { error: message, since: query.since ?? SETTINGS.defaultSince, language: query.language ?? null })
      }
    },
  }
}

export function apply(ctx                 , config                   = {})       {
  SETTINGS.token = (config.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null) || null
  SETTINGS.defaultLimit = clampInt(config.defaultLimit, 15, 3, 25)
  SETTINGS.defaultFocus = clampInt(config.defaultFocus, 3, 1, 6)
  SETTINGS.defaultSince = (['daily', 'weekly', 'monthly']            ).includes(String(config.defaultSince))
    ? (String(config.defaultSince)                 )
    : 'daily'

  const dispose = (() => {
    const cleanups               = []
    return (fn                                )       => {
      if (!fn) return
      try {
        const result = fn()
        if (typeof result === 'function') cleanups.push(result)
      } catch (error) {
        logInfo(ctx, `registration failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  })()

  const effect = (setup                  )       => {
    if (typeof ctx.effect === 'function') {
      ctx.effect(setup)
      return
    }
    dispose(setup)
  }

  effect(() => {
    const tools = ctx.tools
    if (!tools) return () => undefined
    return tools.register(toolDefinition())
  })

  // Second transport: some networks block github.com while the harness' own
  // web-fetch route still reaches it. Registering it as a fallback keeps the
  // plugin working there without giving up the direct fetch elsewhere.
  const webService = safeGet(ctx, 'web')
  if (webService && typeof webService.fetch === 'function') {
    effect(() =>
      registerTextBackend('harness-web', async (url, init) => {
        const result = await webService.fetch({ url }, init.signal)
        const body = result && result.body
        const text = typeof body === 'string' ? body : String((body && body.content) ?? '')
        return {
          status: Number((result && result.statusCode) ?? 0),
          text,
          url: String((result && result.url) ?? url),
          via: 'harness-web',
          truncated: Boolean(result && result.truncated),
        }
      }),
    )
  }

  const commands = safeGet(ctx, 'commands')
  if (commands && typeof commands.register === 'function') {
    effect(() => commands.register(commandDefinition(ctx)))
  }

  // The panel is served by the HTTP carrier. It may activate after this plugin
  // (or restart) so mount reactively instead of probing once at apply time.
  const mountRoute = (host     )                         => {
    try {
      const server = (host && typeof host.get === 'function' ? host.get('webServer') : undefined) ?? host?.webServer
      if (!server || typeof server.register !== 'function') return undefined
      const disposeRoute = server.register(reportRoute(ctx))
      logInfo(ctx, `route mounted at ${ROUTE_BASE}/report`)
      return typeof disposeRoute === 'function' ? disposeRoute : () => undefined
    } catch (error) {
      logInfo(ctx, `route mount failed: ${error instanceof Error ? error.message : String(error)}`)
      return undefined
    }
  }

  const inject                                                                           = (ctx       ).inject
  if (typeof inject === 'function') {
    inject.call(ctx, ['webServer'], (host     ) => {
      effect(() => mountRoute(host) ?? (() => undefined))
    })
  } else {
    let mounted                        
    let tries = 0
    const attempt = ()       => {
      mounted = mounted ?? mountRoute(ctx)
      if (!mounted && tries++ < 40) setTimeout(attempt, 250)
      if (!mounted && tries >= 40) logInfo(ctx, 'webServer service unavailable — the panel feed will not be served')
    }
    attempt()
    effect(() => () => mounted?.())
  }

  logInfo(
    `ready (limit=${SETTINGS.defaultLimit}, focus=${SETTINGS.defaultFocus}, since=${SETTINGS.defaultSince}, token=${SETTINGS.token ? 'yes' : 'no'}, languages=${POPULAR_LANGUAGES.length - 1}, periods=${Object.keys(PERIOD_EN).length})`,
  )
}