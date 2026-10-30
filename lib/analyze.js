// Generated from src/lib/analyze.ts - do not edit by hand; run `node build.mjs`.
/**
 * Deterministic repository analysis.
 *
 * Everything here is rule based on purpose: the plugin must work offline-ish,
 * instantly, and identically every run, without spending model tokens. The rules
 * combine the trending signals (rank, period delta, stars, language,
 * contributors) with optional GitHub API facts (topics, licence, age, issues,
 * README excerpt) into a Chinese narrative per repository.
 */

                                            
                                                                
import { PERIOD_DAYS, PERIOD_ZH } from './trending.js'

                                
               
              
 

                                                 

                               
              
               
              
                  
             
                     
                         
                              
               
               
               
                        
                      
                     
                  
                    
                    
                 
                     
                     
                      
                 
                      
               
              
                           
                  
                        
                          
                         
                           
                   
                              
                   
 

                        
             
            
            
                    
 

const CATEGORY_RULES                 = [
  {
    key: 'ai',
    zh: 'AI / 大模型',
    en: 'AI / LLM',
    keywords: [
      'llm', 'agent', 'agents', 'gpt', 'openai', 'claude', 'gemini', 'llama', 'ollama', 'rag', 'embedding',
      'transformer', 'diffusion', 'inference', 'fine-tun', 'prompt', 'mcp', 'copilot', 'chatbot', 'nlp',
      'vision', 'multimodal', 'speech', 'whisper', 'tutor', 'reasoning', 'neural', 'deep learning', 'pytorch',
      'tensorflow', 'vector database', 'ai', 'model',
    ],
  },
  {
    key: 'devtool',
    zh: '开发者工具',
    en: 'Developer tools',
    keywords: [
      'cli', 'terminal', 'shell prompt', 'compiler', 'linter', 'formatter', 'debugger', 'sdk', 'build system',
      'bundler', 'toolchain', 'vscode', 'neovim', 'vim', 'tmux', 'git ', 'monorepo', 'test runner', 'testing',
      'documentation', 'static site', 'generator', 'scaffold', 'devtools', 'developer tools', 'ide', 'editor',
      'package manager', 'runtime', 'interpreter', 'parser', 'codegen', 'skills', 'methodology', 'workflow',
    ],
  },
  {
    key: 'web',
    zh: 'Web / 前端',
    en: 'Web / frontend',
    keywords: [
      'react', 'vue', 'svelte', 'angular', 'next.js', 'nextjs', 'nuxt', 'remix', 'astro', 'solid',
      'tailwind', 'css', 'html', 'dom', 'frontend', 'ui component', 'component library', 'design system',
      'three.js', 'webgl', 'webgpu', 'animation', 'browser', 'pwa', 'electron', 'tauri', 'web app',
    ],
  },
  {
    key: 'infra',
    zh: '基础设施 / 云原生',
    en: 'Infra / cloud native',
    keywords: [
      'kubernetes', 'k8s', 'docker', 'container', 'serverless', 'terraform', 'operator', 'proxy', 'gateway',
      'nginx', 'service mesh', 'observability', 'monitoring', 'prometheus', 'grafana', 'wasm', 'webassembly',
      'distributed', 'orchestration', 'cloud', 'devops', 'ci/cd', 'deployment', 'load balancer', 'networking',
      'storage engine', 'filesystem', 'virtual machine', 'hypervisor',
    ],
  },
  {
    key: 'data',
    zh: '数据 / 数据库',
    en: 'Data / database',
    keywords: [
      'database', 'sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'clickhouse', 'duckdb', 'kafka',
      'stream processing', 'etl', 'analytics', 'query engine', 'dataframe', 'pandas', 'spark', 'parquet',
      'olap', 'oltp', 'bi ', 'data pipeline', 'data warehouse', 'time series', 'search engine', 'index',
    ],
  },
  {
    key: 'security',
    zh: '安全',
    en: 'Security',
    keywords: [
      'security', 'vulnerability', 'pentest', 'penetration', 'exploit', 'cryptography', 'encryption', 'auth',
      'oauth', 'sandbox', 'malware', 'fuzzing', 'cve', 'zero trust', 'secrets', 'tls', 'firewall', 'scanner',
    ],
  },
  {
    key: 'mobile',
    zh: '移动端',
    en: 'Mobile',
    keywords: ['android', 'ios', 'flutter', 'react native', 'swiftui', 'jetpack compose', 'kotlin multiplatform', 'mobile app'],
  },
  {
    key: 'blockchain',
    zh: '区块链 / Web3',
    en: 'Blockchain / Web3',
    keywords: ['blockchain', 'ethereum', 'solana', 'smart contract', 'defi', 'nft', 'web3', 'solidity', 'onchain', 'evm'],
  },
  {
    key: 'learning',
    zh: '学习资源',
    en: 'Learning resources',
    keywords: [
      'tutorial', 'course', 'book', 'awesome', 'interview', 'roadmap', 'handbook', 'guide', 'cheatsheet',
      'learning', 'notes', 'examples', 'curriculum', 'paper', 'papers', 'study',
    ],
  },
  {
    key: 'productivity',
    zh: '效率 / 自动化',
    en: 'Productivity',
    keywords: ['automation', 'workflow', 'productivity', 'note', 'notes app', 'task', 'todo', 'calendar', 'sync', 'scraper', 'crawler'],
  },
]

const TOPIC_TECH                         = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  nextjs: 'Next.js',
  'next-js': 'Next.js',
  nuxt: 'Nuxt',
  astro: 'Astro',
  tailwindcss: 'Tailwind CSS',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  golang: 'Go',
  go: 'Go',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  'c++': 'C++',
  cpp: 'C++',
  'c#': 'C#',
  dotnet: '.NET',
  php: 'PHP',
  ruby: 'Ruby',
  rails: 'Rails',
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  transformers: 'Transformers',
  langchain: 'LangChain',
  llamaindex: 'LlamaIndex',
  ollama: 'Ollama',
  openai: 'OpenAI API',
  llm: 'LLM',
  'large-language-model': 'LLM',
  'llm-agents': 'LLM Agents',
  agent: 'Agent',
  agents: 'Agent',
  rag: 'RAG',
  mcp: 'MCP',
  'model-context-protocol': 'MCP',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  wasm: 'WebAssembly',
  webassembly: 'WebAssembly',
  webgl: 'WebGL',
  threejs: 'Three.js',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  sqlite: 'SQLite',
  redis: 'Redis',
  kafka: 'Kafka',
  clickhouse: 'ClickHouse',
  duckdb: 'DuckDB',
  graphql: 'GraphQL',
  grpc: 'gRPC',
  electron: 'Electron',
  tauri: 'Tauri',
  flutter: 'Flutter',
  'react-native': 'React Native',
  vscode: 'VS Code',
  neovim: 'Neovim',
  cli: 'CLI',
  'developer-tools': 'DevTools',
  automation: 'Automation',
  'machine-learning': 'Machine Learning',
  'deep-learning': 'Deep Learning',
  'computer-vision': 'Computer Vision',
  nlp: 'NLP',
  security: 'Security',
  blockchain: 'Blockchain',
  'self-hosted': 'Self-hosted',
  observability: 'Observability',
}

const TECH_KEYWORDS                          = [
  [/\breact\b/i, 'React'],
  [/\bnext\.?js\b/i, 'Next.js'],
  [/\bvue\b/i, 'Vue'],
  [/\bsvelte\b/i, 'Svelte'],
  [/\bnuxt\b/i, 'Nuxt'],
  [/\bastro\b/i, 'Astro'],
  [/\btailwind\b/i, 'Tailwind CSS'],
  [/\belectron\b/i, 'Electron'],
  [/\btauri\b/i, 'Tauri'],
  [/\bdeno\b/i, 'Deno'],
  [/\bbun\b/i, 'Bun'],
  [/\bnode\.?js\b/i, 'Node.js'],
  [/\bfastapi\b/i, 'FastAPI'],
  [/\bdjango\b/i, 'Django'],
  [/\bflask\b/i, 'Flask'],
  [/\bpytorch\b/i, 'PyTorch'],
  [/\btensorflow\b/i, 'TensorFlow'],
  [/\bvllm\b/i, 'vLLM'],
  [/\bollama\b/i, 'Ollama'],
  [/\blangchain\b/i, 'LangChain'],
  [/\blanggraph\b/i, 'LangGraph'],
  [/\bmcp\b/i, 'MCP'],
  [/\brag\b/i, 'RAG'],
  [/\btransformer/i, 'Transformers'],
  [/\bgrpc\b/i, 'gRPC'],
  [/\bgraphql\b/i, 'GraphQL'],
  [/\bpostgres/i, 'PostgreSQL'],
  [/\bsqlite\b/i, 'SQLite'],
  [/\bredis\b/i, 'Redis'],
  [/\bkafka\b/i, 'Kafka'],
  [/\bclickhouse\b/i, 'ClickHouse'],
  [/\bduckdb\b/i, 'DuckDB'],
  [/\bkubernetes\b/i, 'Kubernetes'],
  [/\bdocker\b/i, 'Docker'],
  [/\bwasm\b|webassembly/i, 'WebAssembly'],
  [/\bwebgpu\b/i, 'WebGPU'],
  [/\bthree\.?js\b/i, 'Three.js'],
  [/\btokio\b/i, 'Tokio'],
  [/\baxum\b/i, 'Axum'],
  [/\bflutter\b/i, 'Flutter'],
  [/\bswiftui\b/i, 'SwiftUI'],
  [/\bsolidity\b/i, 'Solidity'],
  [/\bneovim\b/i, 'Neovim'],
  [/\bkubernetes operator\b/i, 'Operator'],
  [/\bagent(ic|s)?\b/i, 'Agent 框架'],
  [/\bllms?\b|large language model/i, 'LLM 推理'],
  [/\binference\b/i, '推理引擎'],
  [/\bcuda\b/i, 'CUDA'],
  [/\bgpu\b/i, 'GPU'],
  [/\b(tts|asr|speech)\b/i, '语音处理'],
  [/\bembeddings?\b|vector (db|database|search)/i, '向量检索'],
  [/\bwifi|wi-fi\b/i, '无线信号处理'],
  [/\b(proxy|tunnel|vpn)\b/i, '网络代理'],
  [/\bcli\b|command[- ]line/i, 'CLI 工具'],
  [/\bterminal\b/i, '终端增强'],
  [/\b(sql|query engine|olap)\b/i, 'SQL 引擎'],
  [/\b(benchmark|evaluation|eval harness)\b/i, '评测基准'],
  [/\b(plugin|extension|sdk)\b/i, '插件生态'],
  [/\b(desktop app|electron|tauri)\b/i, '桌面应用'],
]

const LANGUAGE_ECOSYSTEM                         = {
  Rust: 'Cargo',
  Go: 'Go Modules',
  TypeScript: 'npm',
  JavaScript: 'npm',
  Python: 'PyPI',
  Java: 'Maven / Gradle',
  'C++': 'CMake',
  C: 'Make',
  Swift: 'SwiftPM',
  Kotlin: 'Gradle',
  Ruby: 'RubyGems',
  PHP: 'Composer',
  'C#': 'NuGet',
  Dart: 'pub',
  Zig: 'build.zig',
  Elixir: 'Mix',
  Haskell: 'Cabal',
  Lua: 'LuaRocks',
}

                        
                    
                    
 

function escapeRegExp(text        )         {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Short tokens (ai, go, ui, bi, cli) are matched on word boundaries so they do
 * not fire inside longer words; longer phrases are matched as plain substrings.
 */
const COMPILED_RULES                 = CATEGORY_RULES.map((rule) => ({
  rule,
  matchers: rule.keywords.map((keyword) => {
    const needle = keyword.trim().toLowerCase()
    if (needle.length <= 3) return new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`, 'i')
    return new RegExp(escapeRegExp(needle), 'i')
  }),
}))

function scoreRule(matchers          , parts                                                                                     )         {
  let score = 0
  for (const matcher of matchers) {
    if (matcher.test(parts.topics)) score += 3
    if (matcher.test(parts.name)) score += 2
    if (matcher.test(parts.description)) score += 1.5
    if (matcher.test(parts.page)) score += 0.8
    if (matcher.test(parts.readme)) score += 0.3
  }
  return score
}

const FALLBACK_CATEGORY               = { key: 'other', zh: '其他', en: 'Other', keywords: [] }

export function classify(repo              , facts           )               {
  const parts = {
    name: repo.name.toLowerCase(),
    description: (repo.description || '').toLowerCase(),
    topics: facts.topics.join(' ').toLowerCase(),
    readme: (facts.readmeSnippet || '').toLowerCase(),
    page: repo.language ? repo.language.toLowerCase() : '',
  }
  let best = FALLBACK_CATEGORY
  let bestScore = 1.1
  for (const compiled of COMPILED_RULES) {
    const score = scoreRule(compiled.matchers, parts)
    if (score > bestScore) {
      bestScore = score
      best = compiled.rule
    }
  }
  return best
}

export function inferStack(repo              , facts           )           {
  const out           = []
  const push = (value        ) => {
    const label = value.trim()
    if (!label) return
    if (out.some((item) => item.toLowerCase() === label.toLowerCase())) return
    if (out.length < 6) out.push(label)
  }
  if (repo.language) push(repo.language)
  for (const topic of facts.topics) {
    const mapped = TOPIC_TECH[topic.toLowerCase()]
    if (mapped) push(mapped)
  }
  const blob = `${repo.name} ${repo.description} ${facts.topics.join(' ')} ${(facts.readmeSnippet ?? '').slice(0, 260)}`
  for (const [pattern, label] of TECH_KEYWORDS) {
    if (pattern.test(blob)) push(label)
  }
  if (out.length === 0) push('未标注')
  else if (out.length === 1 && repo.language) {
    const ecosystem = LANGUAGE_ECOSYSTEM[repo.language]
    if (ecosystem) push(ecosystem)
  }
  return out
}

/** Automated accounts that show up in GitHub's "Built by" list. */
const BOT_LOGIN = /^(claude|cursoragent|copilot|github-actions|dependabot|renovate|vercel|codex|devin|sweep|aider|openhands|qodo)(\[bot\])?$/i

function formatNumber(value        )         {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

/** Human phrasing for a category bucket; the fallback bucket reads better as prose. */
function categoryPhrase(category              )         {
  if (category.key === 'other') return '暂未归入单一细分赛道，属于综合类项目'
  return `属于 ${category.zh} 方向`
}

function percent(value        )         {
  const pct = value * 100
  if (pct >= 10) return `${pct.toFixed(0)}%`
  if (pct >= 1) return `${pct.toFixed(1)}%`
  return `${pct.toFixed(2)}%`
}

function daysSince(iso               )                {
  if (!iso) return null
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return null
  return Math.max(0, Math.round((Date.now() - time) / 86400000))
}

function firstSentence(text        , max = 160)         {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const match = /^[^.!?。！？]{10,400}[.!?。！？]/.exec(trimmed)
  const sentence = match ? match[0] : trimmed
  return sentence.length > max ? `${sentence.slice(0, max).trim()}…` : sentence
}

/** Appends a full stop unless the text already ends with punctuation. */
function sentenceEnd(text        )         {
  const trimmed = String(text ?? '')
    .trim()
    .replace(/([。！？.!?…])(\s*[。.])+$/, '$1')
  if (!trimmed) return ''
  if (/[。！？.!?…]$/.test(trimmed)) return trimmed
  return /[A-Za-z0-9)\]}'"”]$/.test(trimmed) ? `${trimmed}.` : `${trimmed}。`
}

                                 
                      
                     
 

export function analyzeRepo(repo              , facts           , options                )               {
  const since = options.since
  const periodZh = PERIOD_ZH[since]
  const days = PERIOD_DAYS[since]
  const category = classify(repo, facts)
  const stack = inferStack(repo, facts)
  const stars = repo.stars || 0
  const delta = repo.delta || 0
  const growthRatio = stars > 0 ? delta / Math.max(stars - delta, 1) : 0
  const starsPerDay = delta / days
  const age = daysSince(facts.createdAt)
  const issueRatio = stars > 0 && facts.openIssues !== null ? facts.openIssues / stars : 0
  const language = repo.language
  const contributors = repo.contributors.filter((login) => !BOT_LOGIN.test(login))

  const introBits           = []
  introBits.push(`${repo.name} ${categoryPhrase(category)}`)
  if (language) introBits.push(`以 ${language} 为主要实现语言`)
  introBits.push(`当前累计 ${formatNumber(stars)} star`)
  if (delta > 0) introBits.push(`${periodZh}新增 ${formatNumber(delta)} star`)
  const intro = `${introBits.join('，')}。`

  const highlights           = []
  const risks           = []

  if (repo.rank <= 3) highlights.push(`位列${periodZh}榜第 ${repo.rank} 名，是本期最受关注的项目之一`)
  else if (repo.rank <= 8) highlights.push(`进入${periodZh}榜前 ${repo.rank} 名`)

  if (growthRatio >= 0.1) highlights.push(`周期内 star 增长 ${percent(growthRatio)}，处于高速扩散阶段`)
  else if (growthRatio >= 0.03) highlights.push(`周期内 star 增长 ${percent(growthRatio)}，热度稳定上升`)

  if (stars >= 50000) highlights.push(`累计 ${formatNumber(stars)} star，已是社区级成熟项目`)
  else if (stars >= 10000) highlights.push(`累计 ${formatNumber(stars)} star，社区基础扎实`)
  else if (delta >= 300 && stars > 0) highlights.push(`在 ${formatNumber(stars)} star 的基数上仍取得 ${formatNumber(delta)} 的周期增量`)

  const aiTopic = facts.topics.some((topic) => /(^|-)ai($|-)|llm|agent|gpt|model/.test(topic.toLowerCase()))
  if (aiTopic || category.key === 'ai') highlights.push('处于 AI / 大模型主赛道，与当前技术热点高度重合')

  if (facts.readmeSnippet) {
    const sentence = firstSentence(facts.readmeSnippet, 140)
    if (sentence) highlights.push(`README 自述：${sentence}`)
  }

  if (contributors.length >= 3) {
    highlights.push(`由 ${contributors.slice(0, 3).join('、')} 等 ${contributors.length} 位贡献者共同维护`)
  }
  if (facts.license && facts.license !== 'NOASSERTION') highlights.push(`采用 ${facts.license} 许可证，授权边界清晰`)

  if (stars < 500) risks.push(`star 基数较小（${formatNumber(stars)}），文档与生态成熟度有待验证`)
  if (growthRatio > 0.3) risks.push(`周期增速达 ${percent(growthRatio)}，短期热度偏高，需警惕炒作与回落`)
  if (age !== null && age <= 90) risks.push(`项目创建仅 ${age} 天，接口与方向可能频繁变动`)
  else if (age !== null && age <= 365) risks.push(`项目创建于 ${facts.createdAt?.slice(0, 10)}，仍处于早期迭代阶段`)
  if (facts.archived) risks.push('仓库已归档，官方不再演进')
  if (!facts.license && facts.enriched) risks.push('未获取到许可证信息，商用前需确认授权')
  if (facts.openIssues !== null && facts.openIssues >= 50 && issueRatio > 0.06) {
    risks.push(`开放 issue ${formatNumber(facts.openIssues)} 个，相对 star 规模积压偏多`)
  }
  if (contributors.length === 1) risks.push('核心贡献者高度集中，存在单点维护风险')
  if (!repo.description) risks.push('仓库未提供简介，项目信息透明度较低')
  if (!language) risks.push('未标注主要语言，技术栈信息不完整')
  if (risks.length === 0) risks.push('暂无明显风险信号，但生产可用性仍需自行评估')

  const riskLevel            = risks.length >= 4 ? 'high' : risks.length >= 2 ? 'medium' : 'low'

  const tldr = repo.description
    ? firstSentence(repo.description, 120)
    : `${category.key === 'other' ? '综合类' : category.zh}项目，${language ?? '语言未标注'}，${periodZh}新增 ${formatNumber(delta)} star。`

  const deepDive                  = []
  deepDive.push({
    label: '项目定位',
    text: repo.description
      ? `${repo.name} ${categoryPhrase(category)}。官方简介：${sentenceEnd(repo.description)}`
      : `${repo.name} ${categoryPhrase(category)}，仓库未提供官方简介，以下判断基于名称、语言与社区信号。`,
  })
  const dailyText = days > 1 ? `，折算日均新增 ${formatNumber(starsPerDay)} star` : ''
  deepDive.push({
    label: '增长曲线',
    text: `${periodZh}新增 ${formatNumber(delta)} star，累计 ${formatNumber(stars)} star、${formatNumber(repo.forks)} fork；周期增长率 ${percent(growthRatio)}${dailyText}。${
      repo.contributors.length ? `主要贡献者：${contributors.slice(0, 4).join('、')}。` : ''
    }`,
  })
  deepDive.push({
    label: '技术栈',
    text: `${stack.join(' / ')}${facts.topics.length ? `；仓库 topics：${facts.topics.slice(0, 8).join(', ')}` : ''}。`,
  })
  if (facts.readmeSnippet) {
    deepDive.push({ label: 'README 摘要', text: firstSentence(facts.readmeSnippet, 240) || facts.readmeSnippet.slice(0, 240) })
  }
  deepDive.push({
    label: '值得关注',
    text: sentenceEnd(highlights.slice(0, 4).join('；')),
  })
  deepDive.push({
    label: '需要留意',
    text: sentenceEnd(risks.join('；')),
  })
  deepDive.push({
    label: '适合谁',
    text: suitabilityText(category.key, stars, riskLevel, language),
  })

  return {
    rank: repo.rank,
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    description: repo.description,
    language,
    languageColor: repo.languageColor,
    stars,
    forks: repo.forks,
    delta,
    contributors,
    since,
    periodLabel: periodZh,
    category: category.key,
    categoryZh: category.zh,
    categoryEn: category.en,
    stack,
    growthRatio,
    starsPerDay,
    highlights: highlights.slice(0, 5),
    risks: risks.slice(0, 4),
    riskLevel,
    intro,
    tldr,
    deepDive,
    topics: facts.topics,
    license: facts.license,
    createdAt: facts.createdAt,
    pushedAt: facts.pushedAt,
    openIssues: facts.openIssues,
    archived: facts.archived,
    readmeSnippet: facts.readmeSnippet,
    enriched: facts.enriched,
  }
}

function suitabilityText(category        , stars        , riskLevel           , language               )         {
  const audience                         = {
    ai: '想快速验证大模型 / Agent 能力的开发者，以及需要现成方案做原型的管理者',
    devtool: '希望改进本地开发流程、愿意试用新工具的工程师',
    web: '前端与全栈开发者，尤其是正在选型 UI 框架或交互方案的人',
    infra: '平台工程、SRE 与云原生方向的工程师',
    data: '数据工程与分析团队，关注查询引擎、存储与管道的读者',
    security: '安全工程师与需要做供应链 / 权限治理的团队',
    mobile: '移动端开发者与跨端方案选型者',
    blockchain: 'Web3 开发者与智能合约审计相关从业者',
    learning: '希望系统入门某个方向、偏好由浅入深资料的学习者',
    productivity: '希望用自动化减少重复劳动的效率工具爱好者',
    other: '对该领域有兴趣、愿意自行评估的开发者',
  }
  const base = audience[category] ?? audience.other
  const caution =
    riskLevel === 'high'
      ? '建议先做小范围验证再投入生产。'
      : riskLevel === 'medium'
        ? '建议关注 issue 活跃度与版本节奏，再决定是否引入。'
        : stars >= 10000
          ? '项目成熟度较高，可直接评估引入。'
          : '可先阅读文档与示例，评估与自身场景的匹配度。'
  return `适合${base}。${language ? `技术栈以 ${language} 为主，接入前需确认团队技术储备。` : ''}${caution}`
}

export function analyzeRepos(
  repos                ,
  facts                        ,
  options                ,
)                 {
  return repos.map((repo) => analyzeRepo(repo, facts.get(repo.fullName) ?? emptyFactsFallback(repo.fullName), options))
}

function emptyFactsFallback(fullName        )            {
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
    note: 'not enriched',
  }
}