/**
 * Resaltador de sintaxis ligero 100% Vanilla JS (sin dependencias externas).
 * Usa tokenización de una sola pasada sobre texto sin escapar para evitar
 * corrupción de HTML y mantener un rendimiento fluido en tiempo real.
 */

export function escapeHtml(str = '') {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LANGUAGE_ALIASES = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  typescript: 'typescript',
  json: 'json',
  jsonc: 'json',
  html: 'html',
  htm: 'html',
  xml: 'html',
  svg: 'html',
  css: 'css',
  scss: 'css',
  py: 'python',
  python: 'python',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  powerfx: 'powerfx',
  fx: 'powerfx',
  md: 'markdown',
  markdown: 'markdown',
  txt: 'plaintext',
  text: 'plaintext',
  plaintext: 'plaintext'
};

export function normalizeLanguage(lang = 'plaintext') {
  const key = String(lang || 'plaintext').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'plaintext';
}

export function detectLanguageFromFilename(filename = '') {
  const clean = String(filename || '').trim().toLowerCase();
  const dotIdx = clean.lastIndexOf('.');
  if (dotIdx === -1) return 'plaintext';
  const ext = clean.slice(dotIdx + 1);
  return normalizeLanguage(ext);
}

function span(cls, text) {
  return `<span class="tok-${cls}">${escapeHtml(text)}</span>`;
}

/**
 * Ejecuta una lista ordenada de reglas { regex, token | render } en una sola pasada.
 * Cada regex debe iniciar con ^ (anclado al inicio del fragmento restante) o usarse con sticky (y).
 */
function tokenizeWithRules(source, rules) {
  const text = String(source ?? '');
  const len = text.length;
  const stickyRules = rules.map((r) => ({
    ...r,
    re: new RegExp(r.regex.source, r.regex.flags.replace(/[gy]/g, '') + 'y')
  }));

  let pos = 0;
  let out = '';
  let plainBuf = '';

  const flushPlain = () => {
    if (plainBuf) {
      out += escapeHtml(plainBuf);
      plainBuf = '';
    }
  };

  while (pos < len) {
    let matched = false;
    for (let i = 0; i < stickyRules.length; i++) {
      const rule = stickyRules[i];
      rule.re.lastIndex = pos;
      const m = rule.re.exec(text);
      if (m && m[0].length > 0) {
        flushPlain();
        if (typeof rule.render === 'function') {
          out += rule.render(m);
        } else {
          out += span(rule.token, m[0]);
        }
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      plainBuf += text[pos];
      pos++;
    }
  }

  flushPlain();
  return out;
}

const JS_KEYWORDS =
  /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/;

const TS_EXTRA_KEYWORDS =
  /\b(?:abstract|as|asserts|declare|enum|implements|infer|interface|is|keyof|module|namespace|override|private|protected|public|readonly|require|satisfies|type|unique)\b/;

const JS_BOOLEANS_NULL = /\b(?:true|false|null|undefined|NaN|Infinity)\b/;

const JS_BUILTINS =
  /\b(?:console|window|document|globalThis|Math|JSON|Date|RegExp|Error|TypeError|Promise|Array|Object|String|Number|Boolean|Symbol|BigInt|Map|Set|WeakMap|WeakSet|URL|fetch|setTimeout|setInterval|clearTimeout|clearInterval|localStorage|sessionStorage|indexedDB|navigator)\b/;

const TS_TYPES =
  /\b(?:any|boolean|never|number|object|string|symbol|unknown|void|Record|Partial|Required|Readonly|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|Parameters|Awaited)\b/;

function highlightJsTs(code, isTs = false) {
  const rules = [
    { regex: /\/\/[^\n]*/, token: 'comment' },
    { regex: /\/\*[\s\S]*?\*\//, token: 'comment' },
    { regex: /`(?:\\[\s\S]|[^\\`])*`/, token: 'string' },
    { regex: /"(?:\\.|[^"\\\n])*"/, token: 'string' },
    { regex: /'(?:\\.|[^'\\\n])*'/, token: 'string' },
    ...(isTs ? [{ regex: /@[A-Za-z_$][\w$]*/, token: 'decorator' }] : []),
    { regex: JS_KEYWORDS, token: 'keyword' },
    ...(isTs ? [{ regex: TS_EXTRA_KEYWORDS, token: 'keyword' }] : []),
    { regex: JS_BOOLEANS_NULL, token: 'boolean' },
    ...(isTs ? [{ regex: TS_TYPES, token: 'type' }] : []),
    { regex: JS_BUILTINS, token: 'builtin' },
    { regex: /\b(?:0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b/, token: 'number' },
    {
      regex: /\b([A-Za-z_$][\w$]*)(?=\s*\()/,
      render: (m) => span('function', m[1])
    },
    {
      regex: /\b([A-Z][A-Za-z0-9_$]*)\b/,
      token: 'type'
    },
    {
      regex: /(\.)([A-Za-z_$][\w$]*)/,
      render: (m) => span('punctuation', m[1]) + span('property', m[2])
    },
    { regex: /=>|===|!==|==|!=|<=|>=|\?\?|\?\.|\.\.\.|&&|\|\||[+\-*/%=<>!&|^~?:]/, token: 'operator' },
    { regex: /[{}[\](),;.]/, token: 'punctuation' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightJson(code) {
  const rules = [
    { regex: /\/\/[^\n]*/, token: 'comment' },
    { regex: /\/\*[\s\S]*?\*\//, token: 'comment' },
    {
      regex: /("(?:\\.|[^"\\\n])*")(\s*)(:)/,
      render: (m) => span('property', m[1]) + escapeHtml(m[2]) + span('punctuation', m[3])
    },
    { regex: /"(?:\\.|[^"\\\n])*"/, token: 'string' },
    { regex: /\b(?:true|false|null)\b/, token: 'boolean' },
    { regex: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, token: 'number' },
    { regex: /[{}[\],:]/, token: 'punctuation' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightHtml(code) {
  const rules = [
    { regex: /<!--[\s\S]*?-->/, token: 'comment' },
    { regex: /<!DOCTYPE[^>]*>/i, token: 'keyword' },
    {
      regex: /(<\/?)([A-Za-z][\w:-]*)/,
      render: (m) => span('punctuation', m[1]) + span('tag', m[2])
    },
    { regex: /\/?>/, token: 'punctuation' },
    {
      regex: /([A-Za-z_:][\w:.-]*)(\s*=\s*)("(?:[^"]*)"|'(?:[^']*)')/,
      render: (m) => span('property', m[1]) + span('operator', m[2]) + span('string', m[3])
    },
    { regex: /&[A-Za-z0-9#]+;/, token: 'boolean' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightCss(code) {
  const rules = [
    { regex: /\/\*[\s\S]*?\*\//, token: 'comment' },
    { regex: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/, token: 'string' },
    { regex: /@[a-zA-Z-]+/, token: 'keyword' },
    { regex: /#[0-9a-fA-F]{3,8}\b/, token: 'number' },
    {
      regex: /([a-zA-Z-]+)(\s*)(:)/,
      render: (m) => span('property', m[1]) + escapeHtml(m[2]) + span('punctuation', m[3])
    },
    { regex: /-?\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg|fr)?\b/, token: 'number' },
    { regex: /\.[a-zA-Z_-][\w-]*/, token: 'type' },
    { regex: /[{}();,:]/, token: 'punctuation' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightPython(code) {
  const rules = [
    { regex: /#[^\n]*/, token: 'comment' },
    { regex: /"""[\s\S]*?"""|'''[\s\S]*?'''/, token: 'string' },
    { regex: /[fFrRbBuU]?"(?:\\.|[^"\\\n])*"|[fFrRbBuU]?'(?:\\.|[^'\\\n])*'/, token: 'string' },
    { regex: /@[A-Za-z_]\w*/, token: 'decorator' },
    {
      regex:
        /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|match|case|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/,
      token: 'keyword'
    },
    { regex: /\b(?:True|False|None)\b/, token: 'boolean' },
    {
      regex: /\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|map|filter|isinstance|type|open|super|self)\b/,
      token: 'builtin'
    },
    { regex: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, token: 'number' },
    { regex: /\b([A-Za-z_]\w*)(?=\s*\()/, render: (m) => span('function', m[1]) },
    { regex: /[{}[\](),.:;]/, token: 'punctuation' },
    { regex: /[+\-*/%=<>!&|^~@]+/, token: 'operator' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightSql(code) {
  const rules = [
    { regex: /--[^\n]*/, token: 'comment' },
    { regex: /\/\*[\s\S]*?\*\//, token: 'comment' },
    { regex: /'(?:''|[^'])*'/, token: 'string' },
    {
      regex:
        /\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|VIEW|INDEX|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|IS|NULL|LIKE|ILIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CONSTRAINT|ASC|DESC|EXISTS|WITH)\b/i,
      token: 'keyword'
    },
    { regex: /\b(?:TRUE|FALSE|NULL)\b/i, token: 'boolean' },
    { regex: /\b([A-Za-z_]\w*)(?=\s*\()/, render: (m) => span('function', m[1]) },
    { regex: /\b\d+(?:\.\d+)?\b/, token: 'number' },
    { regex: /[(),.;*]/, token: 'punctuation' },
    { regex: /[=<>!+-/]+/, token: 'operator' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightBash(code) {
  const rules = [
    { regex: /#[^\n]*/, token: 'comment' },
    { regex: /"(?:\\.|[^"\\])*"/, token: 'string' },
    { regex: /'[^']*'/, token: 'string' },
    { regex: /\$\{[^}]+\}|\$[A-Za-z_]\w*|\$[0-9@*?#]/, token: 'property' },
    { regex: /--?[A-Za-z0-9-]+/, token: 'type' },
    {
      regex:
        /\b(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|return|export|local|readonly|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|curl|git|npm|npx|node|python|docker|sudo|chmod|chown)\b/,
      token: 'keyword'
    },
    { regex: /\b\d+\b/, token: 'number' },
    { regex: /&&|\|\||\|>|>>|[|;&<>]/, token: 'operator' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightYaml(code) {
  const rules = [
    { regex: /#[^\n]*/, token: 'comment' },
    { regex: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/, token: 'string' },
    {
      regex: /^(\s*-?\s*)([A-Za-z0-9_.-]+)(\s*:)/m,
      render: (m) => escapeHtml(m[1]) + span('property', m[2]) + span('punctuation', m[3])
    },
    {
      regex: /([A-Za-z0-9_.-]+)(\s*:)(?=\s|$)/,
      render: (m) => span('property', m[1]) + span('punctuation', m[2])
    },
    { regex: /\b(?:true|false|null|yes|no)\b/i, token: 'boolean' },
    { regex: /-?\b\d+(?:\.\d+)?\b/, token: 'number' },
    { regex: /[\[\]{},:-]/, token: 'punctuation' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightPowerFx(code) {
  const rules = [
    { regex: /\/\/[^\n]*/, token: 'comment' },
    { regex: /\/\*[\s\S]*?\*\//, token: 'comment' },
    { regex: /"(?:""|[^"\n])*"/, token: 'string' },
    { regex: /'(?:''|[^'\n])*'/, token: 'property' },
    {
      regex:
        /\b(?:If|Switch|With|ForAll|Filter|LookUp|Search|Sort|SortByColumns|Set|UpdateContext|Patch|Collect|ClearCollect|Clear|Remove|RemoveIf|Navigate|Back|Notify|Reset|Blank|IsBlank|IsEmpty|Coalesce|Text|Value|CountRows|First|Last|Table|Record|Self|Parent|ThisItem|ThisRecord|And|Or|Not|In|ExactIn)\b/,
      token: 'keyword'
    },
    { regex: /\b(?:true|false)\b/i, token: 'boolean' },
    { regex: /\b([A-Za-z_]\w*)(?=\s*\()/, render: (m) => span('function', m[1]) },
    { regex: /\b\d+(?:\.\d+)?\b/, token: 'number' },
    { regex: /[{}[\](),.;:]/, token: 'punctuation' },
    { regex: /&&|\|\||<>|<=|>=|[=<>+\-*/&!]/, token: 'operator' }
  ];
  return tokenizeWithRules(code, rules);
}

function highlightMarkdown(code) {
  const rules = [
    { regex: /```[^\n]*/, token: 'keyword' },
    { regex: /#{1,6}[ \t]+[^\n]*/, token: 'tag' },
    { regex: /`[^`\n]+`/, token: 'string' },
    { regex: /\*\*[^*\n]+\*\*/, token: 'function' },
    { regex: /\[[^\]]+\]\([^)]+\)/, token: 'property' },
    { regex: />[ \t]?[^\n]*/, token: 'comment' }
  ];
  return tokenizeWithRules(code, rules);
}

/**
 * Resalta un bloque de código y devuelve HTML seguro con spans `.tok-*`.
 */
export function highlightCode(code = '', language = 'plaintext') {
  const lang = normalizeLanguage(language);
  const src = String(code ?? '');
  if (!src) return '';

  switch (lang) {
    case 'javascript':
      return highlightJsTs(src, false);
    case 'typescript':
      return highlightJsTs(src, true);
    case 'json':
      return highlightJson(src);
    case 'html':
      return highlightHtml(src);
    case 'css':
      return highlightCss(src);
    case 'python':
      return highlightPython(src);
    case 'sql':
      return highlightSql(src);
    case 'bash':
      return highlightBash(src);
    case 'yaml':
      return highlightYaml(src);
    case 'powerfx':
      return highlightPowerFx(src);
    case 'markdown':
      return highlightMarkdown(src);
    default:
      return escapeHtml(src);
  }
}
