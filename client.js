// Generated from src/client.ts - do not edit by hand; run `node build.mjs`.
/**
 * @royalsan/dsh-github-trending — Web (client) half.
 *
 * Registers a sidebar entry plus its main panel. The panel fetches
 * /dsh-github-trending/report from the host half and renders an interactive
 * card report: period tabs, language select, category chips, search, KPI tiles
 * and paginated repository cards that show the full analysis inline.
 */

window.__ModuleLoader__.load({
  id: '@royalsan/dsh-github-trending',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const useState = React.useState
    const useEffect = React.useEffect
    const useMemo = React.useMemo

    const NS = 'dsh-github-trending'
    const BASE = '/dsh-github-trending'

/**
 * A 404 here means the HTTP route never mounted (host half not loaded, or the
 * carrier activated after the plugin). Say so instead of printing a bare status.
 */
function describeFailure(status, body) {
  if (status === 404) {
    return '报告接口未挂载（HTTP 404）· 主机端插件未加载，请重启 Harness 或重新启用插件'
  }
  return (body && body.error) || 'HTTP ' + status
}
    const PAGE_SIZE = 6

    /** Filled in apply(); the slot components are rendered by the shell, not by us. */
    let LOCALE = null

    const LANGUAGES = [
      { label: '全部语言', slug: '' },
      { label: 'TypeScript', slug: 'typescript' },
      { label: 'JavaScript', slug: 'javascript' },
      { label: 'Python', slug: 'python' },
      { label: 'Rust', slug: 'rust' },
      { label: 'Go', slug: 'go' },
      { label: 'C++', slug: 'c++' },
      { label: 'C', slug: 'c' },
      { label: 'C#', slug: 'c#' },
      { label: 'Java', slug: 'java' },
      { label: 'Kotlin', slug: 'kotlin' },
      { label: 'Swift', slug: 'swift' },
      { label: 'Dart', slug: 'dart' },
      { label: 'PHP', slug: 'php' },
      { label: 'Ruby', slug: 'ruby' },
      { label: 'Zig', slug: 'zig' },
      { label: 'Lua', slug: 'lua' },
      { label: 'Shell', slug: 'shell' },
      { label: 'Jupyter Notebook', slug: 'jupyter-notebook' },
      { label: 'Vue', slug: 'vue' },
      { label: 'HTML', slug: 'html' },
      { label: 'CSS', slug: 'css' },
      { label: 'Solidity', slug: 'solidity' },
    ]

    const ZH = {
      'nav.title': 'GitHub 趋势',
      'title': 'GitHub 趋势雷达',
      'subtitle': '抓取 Trending 榜单 · 结构化分析 · 交互式卡片报告',
      'refresh': '刷新',
      'period.daily': '日榜',
      'period.weekly': '周榜',
      'period.monthly': '月榜',
      'filter.language': '语言',
      'filter.category': '分类',
      'filter.all': '全部',
      'search.placeholder': '搜索仓库名、简介或标签…',
      'stat.repos': '收录仓库',
      'stat.delta': '周期 star 增量',
      'stat.stars': '累计 star',
      'stat.language': '最热语言',
      'section.overview': '趋势总览',
      'section.repos': '仓库卡片',
      'page.prev': '上一页',
      'page.next': '下一页',
      'page.info': '第 {page} / {total} 页 · 共 {count} 个仓库',
      'loading': '正在抓取 GitHub Trending…',
      'error': '报告加载失败',
      'retry': '重试',
      'risk.high': '风险偏高',
      'risk.medium': '风险中等',
      'risk.low': '风险较低',
      'metric.stars': 'star',
      'metric.forks': 'fork',
      'metric.delta': '本期新增',
      'metric.growth': '周期增长率',
      'empty': '当前筛选下没有匹配的仓库',
      'updated': '更新于',
      'cache.hit': '缓存',
      'cache.fresh': '实时',
      'risk.summary': '风险分布',
      'view.on.github': '在 GitHub 打开',
    }

    const EN = {
      'nav.title': 'GitHub Trending',
      'title': 'GitHub Trending Radar',
      'subtitle': 'Scrape the board · structured analysis · interactive card report',
      'refresh': 'Refresh',
      'period.daily': 'Today',
      'period.weekly': 'This week',
      'period.monthly': 'This month',
      'filter.language': 'Language',
      'filter.category': 'Category',
      'filter.all': 'All',
      'search.placeholder': 'Search name, description or topics…',
      'stat.repos': 'Repositories',
      'stat.delta': 'Star gain',
      'stat.stars': 'Total stars',
      'stat.language': 'Top language',
      'section.overview': 'Overview',
      'section.repos': 'Repository cards',
      'page.prev': 'Previous',
      'page.next': 'Next',
      'page.info': 'Page {page} / {total} · {count} repositories',
      'loading': 'Fetching GitHub Trending…',
      'error': 'Failed to load the report',
      'retry': 'Retry',
      'risk.high': 'High risk',
      'risk.medium': 'Medium risk',
      'risk.low': 'Low risk',
      'metric.stars': 'stars',
      'metric.forks': 'forks',
      'metric.delta': 'gain',
      'metric.growth': 'growth',
      'empty': 'No repository matches the current filters',
      'updated': 'Updated',
      'cache.hit': 'cached',
      'cache.fresh': 'live',
      'risk.summary': 'Risk mix',
      'view.on.github': 'Open on GitHub',
    }

    function detectLocale(locale) {
      try {
        if (locale && typeof locale.getLocale === 'function') {
          const active = locale.getLocale()
          if (active && active.active) return String(active.active)
        }
      } catch (error) {
        /* ignore */
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.language) return String(navigator.language)
      } catch (error) {
        /* ignore */
      }
      return 'zh'
    }

    function makeT(locale) {
      const active = detectLocale(locale)
      const table = active.toLowerCase().indexOf('en') === 0 ? EN : ZH
      const fallback = ZH
      return function t(key, params) {
        let text = table[key] !== undefined ? table[key] : fallback[key] !== undefined ? fallback[key] : key
        if (params) {
          for (const name of Object.keys(params)) text = text.split('{' + name + '}').join(String(params[name]))
        }
        return text
      }
    }

    function compact(value) {
      const number = Number(value) || 0
      if (Math.abs(number) >= 1000000) return (number / 1000000).toFixed(1) + 'M'
      if (Math.abs(number) >= 10000) return (number / 1000).toFixed(1) + 'k'
      return new Intl.NumberFormat('en-US').format(Math.round(number))
    }

    function percent(value) {
      const raw = (Number(value) || 0) * 100
      if (raw >= 10) return raw.toFixed(0) + '%'
      if (raw >= 1) return raw.toFixed(1) + '%'
      return raw.toFixed(2) + '%'
    }

    /** Local wall-clock time for the report timestamp (browser time zone). */
    function localTime(iso) {
      const time = Date.parse(String(iso || ''))
      if (!Number.isFinite(time)) return ''
      const date = new Date(time)
      const pad = function (value) { return String(value).padStart(2, '0') }
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
    }

    function shortRisk(risk, t) {
      if (!risk) return ''
      return [t('risk.high') + ' ' + risk.high, t('risk.medium') + ' ' + risk.medium, t('risk.low') + ' ' + risk.low].join(' · ')
    }

    /** Owner avatar straight from GitHub so every card carries a recognisable image. */
    function avatarUrl(owner) {
      const login = String(owner || '').trim()
      if (!login) return ''
      return 'https://github.com/' + encodeURIComponent(login) + '.png?size=96'
    }

    function riskTone(level) {
      if (level === 'high') return 'error'
      if (level === 'medium') return 'warn'
      return 'success'
    }

    const CSS = [
      '.gt-root{box-sizing:border-box;height:100%;overflow:auto;padding:22px 26px 56px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"PingFang SC","Microsoft YaHei",sans-serif}',
      '.gt-root *{box-sizing:border-box}',
      '.gt-shell{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:18px}',
      '.gt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}',
      '.gt-brand{display:flex;align-items:center;gap:12px;min-width:260px}',
      '.gt-mark{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.gt-h1{margin:0;font-size:19px;font-weight:650;letter-spacing:.2px}',
      '.gt-sub{margin:2px 0 0;font-size:12.5px;color:var(--dsw-alias-label-secondary)}',
      '.gt-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.gt-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;cursor:pointer;text-decoration:none;transition:border-color .15s ease,background .15s ease}',
      '.gt-btn:hover{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.gt-btn[data-primary="1"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}',
      '.gt-btn:disabled{opacity:.55;cursor:not-allowed}',
      '.gt-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}',
      '.gt-seg{display:inline-flex;padding:3px;gap:2px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}',
      '.gt-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;padding:5px 12px;border-radius:8px;cursor:pointer}',
      '.gt-seg button[data-active="1"]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.12)}',
      '.gt-select,.gt-input{height:32px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:0 10px;outline:none}',
      '.gt-select:focus,.gt-input:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.gt-input{flex:1 1 220px;min-width:180px}',
      '.gt-chips{display:flex;gap:6px;flex-wrap:wrap}',
      '.gt-chip{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer}',
      '.gt-chip[data-active="1"]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}',
      '.gt-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
      '.gt-stat{padding:14px 15px;border-radius:13px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.gt-stat-label{font-size:11.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}',
      '.gt-stat-value{font-size:22px;font-weight:650;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.gt-stat-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.gt-card{border:1px solid var(--dsw-alias-border-l1);border-radius:15px;background:var(--dsw-alias-bg-layer-1);padding:16px;min-width:0}',
      '.gt-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.gt-section-title small{font-weight:400;font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.gt-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}',
      '.gt-repo{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);padding:15px;display:flex;flex-direction:column;gap:10px;min-width:0;transition:border-color .15s ease,transform .15s ease}',
      '.gt-repo:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.gt-repo-head{display:flex;align-items:flex-start;gap:10px;min-width:0}',
      '.gt-avatar{position:relative;flex:0 0 auto;width:34px;height:34px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);font-size:12px;font-weight:700;color:var(--dsw-alias-label-secondary);text-transform:uppercase;user-select:none}',
      '.gt-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:var(--dsw-alias-bg-layer-2)}',
      '.gt-rank{flex:none;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.gt-rank[data-top="1"]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 18%,transparent);color:var(--dsw-alias-state-warn-primary)}',
      '.gt-repo-name{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}',
      '.gt-repo-name:hover{color:var(--dsw-alias-brand-primary)}',
      '.gt-repo-owner{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.gt-desc{font-size:12.5px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:34px}',
      '.gt-metrics{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.gt-metrics b{color:var(--dsw-alias-label-primary);font-weight:600}',
      '.gt-tags{display:flex;gap:6px;flex-wrap:wrap}',
      '.gt-tag{font-size:11px;padding:2px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);white-space:nowrap}',
      '.gt-tag[data-tone="brand"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}',
      '.gt-tag[data-tone="error"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}',
      '.gt-tag[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent)}',
      '.gt-tag[data-tone="success"]{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent)}',
      '.gt-block{margin-top:2px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l1);font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary);display:flex;flex-direction:column;gap:6px}',
      '.gt-block b{color:var(--dsw-alias-label-primary);font-weight:600}',
      '.gt-bullets{margin:6px 0 0;padding-left:16px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.gt-bullets li{margin:3px 0}',
      '.gt-pager{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary);flex-wrap:wrap}',
      '.gt-pager-btns{display:flex;gap:6px;align-items:center}',
      '.gt-pager-btns button{width:28px;height:28px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}',
      '.gt-pager-btns button[data-active="1"]{color:#fff;background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.gt-pager-btns button:disabled{opacity:.45;cursor:not-allowed}',
      '.gt-note{font-size:11.5px;color:var(--dsw-alias-label-secondary);display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '.gt-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);display:inline-block;flex:none}',
      '.gt-error{border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);border-radius:13px;padding:14px 16px;font-size:13px}',
      '.gt-error b{display:block;margin-bottom:4px}',
      '.gt-skeleton{height:110px;border-radius:14px;background:linear-gradient(90deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));background-size:200% 100%;animation:gt-shimmer 1.4s ease-in-out infinite}',
      '@keyframes gt-shimmer{0%{background-position:0% 0}100%{background-position:-200% 0}}',
      '.gt-empty{padding:34px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px;border:1px dashed var(--dsw-alias-border-l1);border-radius:14px}',
      '@media (max-width:1100px){.gt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '@media (max-width:900px){.gt-cards{grid-template-columns:1fr}}',
    ].join('\n')

    function TrendIcon(props) {
      const size = (props && props.size) || 20
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M3 16.5 9 10l4 3.6L21 6',
          stroke: 'var(--dsw-alias-brand-primary)',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M15.5 6H21v5.5', stroke: 'var(--dsw-alias-state-success-primary)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      )
    }

    function NavIcon() {
      return h(
        'span',
        { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, title: 'GitHub Trending' },
        h(TrendIcon, { size: 18 }),
      )
    }

    function Tag(props) {
      return h('span', { className: 'gt-tag', 'data-tone': props.tone || 'plain' }, props.children)
    }

    function Stat(props) {
      return h(
        'div',
        { className: 'gt-stat' },
        h('span', { className: 'gt-stat-label' }, props.label),
        h('span', { className: 'gt-stat-value' }, props.value),
        props.hint ? h('span', { className: 'gt-stat-hint' }, props.hint) : null,
      )
    }

    function RepoCard(props) {
      const repo = props.repo
      const t = props.t
      const blocks = repo.deepDive || []
      return h(
        'article',
        { className: 'gt-repo' },
        h(
          'div',
          { className: 'gt-repo-head' },
          h(
            'span',
            { className: 'gt-avatar', title: repo.owner },
            String(repo.owner || '?').slice(0, 2),
            avatarUrl(repo.owner)
              ? h('img', {
                  src: avatarUrl(repo.owner),
                  alt: repo.owner,
                  loading: 'lazy',
                  onError: function (event) {
                    event.currentTarget.style.display = 'none'
                  },
                })
              : null,
          ),
          h('span', { className: 'gt-rank', 'data-top': repo.rank <= 3 ? '1' : '0' }, '#' + repo.rank),
          h(
            'div',
            { style: { minWidth: 0, flex: 1 } },
            h('a', { className: 'gt-repo-name', href: repo.url, target: '_blank', rel: 'noreferrer', title: repo.fullName }, repo.name),
            h('span', { className: 'gt-repo-owner' }, repo.owner),
          ),
          h(Tag, { tone: riskTone(repo.riskLevel) }, t('risk.' + repo.riskLevel)),
        ),
        h('p', { className: 'gt-desc' }, repo.tldr || repo.description || '—'),
        h(
          'div',
          { className: 'gt-metrics' },
          h('span', null, h('b', null, compact(repo.stars)), ' ', t('metric.stars')),
          h('span', null, h('b', null, compact(repo.forks)), ' ', t('metric.forks')),
          h('span', null, h('b', { style: { color: 'var(--dsw-alias-state-success-primary)' } }, '+' + compact(repo.delta)), ' ', t('metric.delta')),
          h('span', null, h('b', null, percent(repo.growthRatio)), ' ', t('metric.growth')),
        ),
        h(
          'div',
          { className: 'gt-tags' },
          repo.language ? h('span', { className: 'gt-tag' }, h('span', { className: 'gt-dot', style: { background: repo.languageColor || 'var(--dsw-alias-state-idle-primary)', marginRight: 5 } }), repo.language) : null,
          h(Tag, { tone: 'brand' }, repo.categoryZh),
          (repo.stack || []).filter(function (tech) { return tech !== repo.language }).slice(0, 3).map(function (tech) {
            return h('span', { className: 'gt-tag', key: tech }, tech)
          }),
        ),
        blocks.length
          ? h(
              'div',
              { className: 'gt-block' },
              blocks.map(function (block, index) {
                return h('div', { key: index }, h('b', null, block.label + '：'), block.text)
              }),
            )
          : null,
      )
    }

    function useReport(params) {
      const [state, setState] = useState({ status: 'loading', data: null, error: null })
      const [nonce, setNonce] = useState(0)
      useEffect(
        function () {
          const controller = new AbortController()
          let alive = true
          setState(function (prev) {
            return { status: prev.data ? 'refreshing' : 'loading', data: prev.data, error: null }
          })
          const query = new URLSearchParams({ since: params.since, limit: '15', focus: '3' })
          if (params.language) query.set('language', params.language)
          if (nonce > 0) query.set('refresh', '1')
          fetch(BASE + '/report?' + query.toString(), {
            signal: controller.signal,
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
          })
            .then(function (response) {
              return response.json().then(
                function (body) {
                  if (!response.ok) throw new Error(describeFailure(response.status, body))
                  return body
                },
                function () {
                  throw new Error(describeFailure(response.status, null))
                },
              )
            })
            .then(function (data) {
              if (!alive) return
              setState({ status: 'ready', data: data, error: null })
            })
            .catch(function (error) {
              if (!alive) return
              if (error && error.name === 'AbortError') return
              setState({ status: 'error', data: null, error: (error && error.message) || String(error) })
            })
          return function () {
            alive = false
            controller.abort()
          }
        },
        [params.since, params.language, nonce],
      )
      return [state, function () { setNonce(function (value) { return value + 1 }) }]
    }

    function Panel() {
      const t = useMemo(function () { return makeT(LOCALE) }, [])
      const [since, setSince] = useState('daily')
      const [language, setLanguage] = useState('')
      const [category, setCategory] = useState('all')
      const [search, setSearch] = useState('')
      const [page, setPage] = useState(1)
      const [state, refresh] = useReport({ since: since, language: language })
      const data = state.data

      useEffect(function () { setPage(1) }, [since, language, category, search])

      const repos = (data && data.repos) || []
      const categories = useMemo(function () {
        const seen = {}
        const out = []
        for (const repo of repos) {
          if (!seen[repo.category]) {
            seen[repo.category] = true
            out.push({ key: repo.category, label: repo.categoryZh })
          }
        }
        return out
      }, [repos])

      const filtered = useMemo(
        function () {
          const needle = search.trim().toLowerCase()
          return repos.filter(function (repo) {
            if (category !== 'all' && repo.category !== category) return false
            if (!needle) return true
            const blob = [repo.fullName, repo.description, repo.tldr, (repo.stack || []).join(' '), (repo.topics || []).join(' ')].join(' ').toLowerCase()
            return blob.indexOf(needle) >= 0
          })
        },
        [repos, category, search],
      )

      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
      const currentPage = Math.min(page, totalPages)
      const pageRepos = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
      const summary = (data && data.summary) || null
      const children = []

      children.push(
        h(
          'header',
          { className: 'gt-head', key: 'head' },
          h(
            'div',
            { className: 'gt-brand' },
            h('div', { className: 'gt-mark' }, h(TrendIcon, { size: 22 })),
            h(
              'div',
              null,
              h('h1', { className: 'gt-h1' }, t('title')),
              h('p', { className: 'gt-sub' }, t('subtitle')),
            ),
          ),
          h(
            'div',
            { className: 'gt-actions' },
            data ? h('span', { className: 'gt-note' }, t('updated') + ' ' + localTime(data.generatedAt) + ' · ' + (data.cache === 'hit' ? t('cache.hit') : t('cache.fresh'))) : null,
            h('button', { type: 'button', className: 'gt-btn', onClick: refresh, disabled: state.status === 'loading' || state.status === 'refreshing' }, t('refresh')),
          ),
        ),
      )

      children.push(
        h(
          'div',
          { className: 'gt-toolbar', key: 'toolbar' },
          h(
            'div',
            { className: 'gt-seg' },
            ['daily', 'weekly', 'monthly'].map(function (value) {
              return h(
                'button',
                { key: value, type: 'button', 'data-active': since === value ? '1' : '0', onClick: function () { setSince(value) } },
                t('period.' + value),
              )
            }),
          ),
          h(
            'select',
            { className: 'gt-select', value: language, onChange: function (event) { setLanguage(event.target.value) }, 'aria-label': t('filter.language') },
            LANGUAGES.map(function (item) {
              return h('option', { key: item.slug || 'all', value: item.slug }, item.label)
            }),
          ),
          h('input', {
            className: 'gt-input',
            placeholder: t('search.placeholder'),
            value: search,
            onChange: function (event) { setSearch(event.target.value) },
            'aria-label': t('search.placeholder'),
          }),
        ),
      )

      if (categories.length > 1) {
        children.push(
          h(
            'div',
            { className: 'gt-chips', key: 'chips' },
            [{ key: 'all', label: t('filter.all') }].concat(categories).map(function (item) {
              return h(
                'button',
                { key: item.key, type: 'button', className: 'gt-chip', 'data-active': category === item.key ? '1' : '0', onClick: function () { setCategory(item.key) } },
                item.label,
              )
            }),
          ),
        )
      }

      if (state.status === 'loading' && !data) {
        children.push(h('div', { className: 'gt-skeleton', key: 'sk1' }))
        children.push(h('div', { className: 'gt-skeleton', key: 'sk2', style: { height: 180 } }))
        children.push(h('p', { className: 'gt-note', key: 'note' }, t('loading')))
      } else if (state.status === 'error' && !data) {
        children.push(
          h(
            'div',
            { className: 'gt-error', key: 'error' },
            h('b', null, t('error')),
            h('div', null, state.error),
            h('button', { type: 'button', className: 'gt-btn', onClick: refresh, style: { marginTop: 10 } }, t('retry')),
          ),
        )
      } else if (data) {
        children.push(
          h(
            'div',
            { className: 'gt-grid', key: 'stats' },
            h(Stat, { label: t('stat.repos'), value: compact(summary ? summary.repoCount : repos.length), hint: (data.language || t('filter.all')) + ' · ' + t('period.' + data.since) }),
            h(Stat, { label: t('stat.delta'), value: '+' + compact(summary ? summary.totalDelta : 0), hint: summary && summary.topMover ? summary.topMover.fullName : '' }),
            h(Stat, { label: t('stat.stars'), value: compact(summary ? summary.totalStars : 0), hint: summary ? shortRisk(summary.riskCount, t) : '' }),
            h(Stat, { label: t('stat.language'), value: (summary && summary.topLanguage) || '—', hint: percent(summary ? summary.avgGrowth : 0) + ' ' + t('metric.growth') }),
          ),
        )

        children.push(
          h(
            'section',
            { className: 'gt-card', key: 'repos' },
            h('h2', { className: 'gt-section-title' }, t('section.repos'), h('small', null, String(filtered.length) + ' / ' + String(repos.length))),
            filtered.length === 0
              ? h('div', { className: 'gt-empty' }, t('empty'))
              : h('div', { className: 'gt-cards' }, pageRepos.map(function (repo) { return h(RepoCard, { key: repo.fullName, repo: repo, t: t }) })),
            filtered.length > PAGE_SIZE
              ? h(
                  'div',
                  { className: 'gt-pager', style: { marginTop: 12 } },
                  h('span', null, t('page.info', { page: currentPage, total: totalPages, count: filtered.length })),
                  h(
                    'div',
                    { className: 'gt-pager-btns' },
                    h('button', { type: 'button', disabled: currentPage <= 1, onClick: function () { setPage(currentPage - 1) }, 'aria-label': t('page.prev') }, '‹'),
                    Array.from({ length: totalPages }, function (_item, index) {
                      const number = index + 1
                      if (totalPages > 7 && Math.abs(number - currentPage) > 2 && number !== 1 && number !== totalPages) return null
                      return h(
                        'button',
                        { key: number, type: 'button', 'data-active': number === currentPage ? '1' : '0', onClick: function () { setPage(number) } },
                        String(number),
                      )
                    }).filter(Boolean),
                    h('button', { type: 'button', disabled: currentPage >= totalPages, onClick: function () { setPage(currentPage + 1) }, 'aria-label': t('page.next') }, '›'),
                  ),
                )
              : null,
          ),
        )

        }

      return h('div', { className: 'gt-root' }, h('style', null, CSS), h('div', { className: 'gt-shell' }, children))
    }

    return {
      inject: ['slots'],
      /** Exposed for the bundle smoke test: lets it assert every label exists in both languages. */
      dictionaries: { zh: ZH, en: EN },
      apply(ctx) {
        let locale = null
        try {
          locale = typeof ctx.get === 'function' ? ctx.get('locale') : null
        } catch (error) {
          locale = null
        }
        if (locale && typeof locale.register === 'function') {
          try {
            locale.register(NS, 'zh', ZH)
            locale.register(NS, 'en', EN)
          } catch (error) {
            /* translations are optional; the built-in dictionary is the fallback */
          }
        }
        LOCALE = locale

        const t = makeT(locale)

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({ name: 'sidebar.panellist', id: 'github-trending', order: 30, label: t('nav.title') }, NavIcon)
        })

        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: 'github-trending' }, Panel)
        })
      },
    }
  },
})