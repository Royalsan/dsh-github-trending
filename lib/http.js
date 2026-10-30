// Generated from src/lib/http.ts - do not edit by hand; run `node build.mjs`.
/**
 * Outbound text transport with a fallback chain.
 *
 * GitHub HTML endpoints are blocked or throttled on some networks while the
 * Harness host keeps a working route of its own. Instead of hard-coding one
 * transport, this module keeps an ordered list of backends: the direct
 * `fetch()` first, then any backend the Host half registers from `ctx.web`.
 * The first backend that answers wins; every failure is collected so the final
 * error names each route that was tried.
 *
 * @module @royalsan/dsh-github-trending/http
 */

/** Per-request options shared by every backend. */
                           
                                           
                               
                             
 

/** One answer from a backend. */
                             
                         
                       
                      
                                                                    
                      
                                                         
                              
 

/** A transport a backend may provide. Throwing means "try the next backend". */
                                                                              

const DEFAULT_TIMEOUT_MS = 20000

/**
 * Flatten an error and its `cause` chain into one actionable line, so a failed
 * outbound request reports its real reason instead of undici's bare
 * `fetch failed`.
 */
export function describeFetchError(error         )         {
  const parts           = []
  let current      = error
  for (let depth = 0; current && depth < 5; depth += 1) {
    const message = typeof current.message === 'string' ? current.message : String(current)
    const code = typeof current.code === 'string' ? current.code : ''
    const detail = [
      code && !message.includes(code) ? `${message} [${code}]` : message,
      typeof current.errno === 'string' ? `errno=${current.errno}` : '',
      current.hostname ? `host=${current.hostname}` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
    if (detail && !parts.includes(detail)) parts.push(detail)
    current = current.cause
  }
  return parts.join(' || ') || 'unknown error'
}

const FALLBACKS                                         = []

function linkedSignal(timeoutMs        , outer              )                                           {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs))
  const relay = () => controller.abort()
  if (outer) {
    if (outer.aborted) controller.abort()
    else outer.addEventListener('abort', relay, { once: true })
  }
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer)
      if (outer) outer.removeEventListener('abort', relay)
    },
  }
}

/** Plain `fetch()` — the default and usually fastest route. */
export const directBackend              = async (url, init) => {
  const { signal, dispose } = linkedSignal(init.timeoutMs ?? DEFAULT_TIMEOUT_MS, init.signal)
  try {
    const response = await fetch(url, { signal, headers: init.headers })
    const text = await response.text()
    return { status: response.status, text, url, via: 'direct' }
  } catch (error) {
    throw new Error(`direct fetch ${describeFetchError(error)}`, { cause: error })
  } finally {
    dispose()
  }
}

/**
 * Append a fallback transport. Returns a disposer that removes it again, so the
 * Host can clean up when its plugin context goes away.
 */
export function registerTextBackend(id        , backend             )             {
  const entry = { id, backend }
  FALLBACKS.push(entry)
  return () => {
    const index = FALLBACKS.indexOf(entry)
    if (index >= 0) FALLBACKS.splice(index, 1)
  }
}

/** Backend ids in the order they are tried, for diagnostics. */
export function textBackendIds()           {
  return ['direct', ...FALLBACKS.map((entry) => entry.id)]
}

/**
 * Fetch one URL as text, trying each backend in order. Resolves with the first
 * answer (including non-2xx: the caller decides), throws only when every
 * backend failed.
 */
export async function fetchText(url        , init           = {})                      {
  const failures           = []
  const chain = [{ id: 'direct', backend: directBackend }, ...FALLBACKS]
  // With more than one route, cap each attempt so a hanging first route still
  // leaves time for the next one inside the caller's own budget.
  const perAttempt = chain.length > 1 ? Math.min(init.timeoutMs ?? DEFAULT_TIMEOUT_MS, 15000) : init.timeoutMs
  for (const entry of chain) {
    try {
      const result = await entry.backend(url, { ...init, timeoutMs: perAttempt })
      if (typeof result.text === 'string') return result
      failures.push(`${entry.id}: empty body`)
    } catch (error) {
      failures.push(`${entry.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  throw new Error(`no transport could load ${url} (${failures.join('; ')})`)
}