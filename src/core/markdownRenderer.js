import { escapeHtml, highlightCode } from './syntaxHighlighter.js';

/**
 * Formatea elementos inline de Markdown (imágenes, código, enlaces, negrita, cursiva, tachado, variables)
 */
function parseInlineMarkdown(text = '') {
  let html = escapeHtml(text);

  // Imágenes inline ![alt](url)
  html = html.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+|\.?\.?\/[^\s)]+)\)/g,
    '<img src="$2" alt="$1" class="my-2 max-w-full rounded-lg border border-slate-800 inline-block" />'
  );

  // Código inline `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono text-[12px] border border-slate-700/70">$1</code>'
  );

  // Enlaces [texto](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">$1</a>'
  );

  // Negrita **texto**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Cursiva *texto*
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>');

  // Tachado ~~texto~~
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-slate-500">$1</del>');

  // Resaltar variables {{variable}} aún sin interpolar
  html = html.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px]">{{$1}}</span>'
  );

  return html;
}

/**
 * Convierte texto Markdown en HTML rico estilizado para vista previa y exportación.
 * Incluye resaltado de sintaxis en bloques de código ```lang.
 */
export function renderMarkdownToHtml(markdown = '') {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Bloque de código ```lang
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'plaintext';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // saltar cierre ```
      const highlighted = highlightCode(codeLines.join('\n'), lang);
      out.push(`
        <div class="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90">
          <div class="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>${escapeHtml(lang)}</span>
          </div>
          <pre class="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed custom-scrollbar"><code>${highlighted}</code></pre>
        </div>
      `);
      continue;
    }

    // Línea horizontal
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push('<hr class="my-4 border-slate-800" />');
      i++;
      continue;
    }

    // Encabezados # a ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseInlineMarkdown(headingMatch[2].trim());
      const sizeMap = {
        1: 'text-xl font-bold text-white border-b border-slate-800 pb-2 mt-4 mb-3',
        2: 'text-lg font-bold text-slate-100 mt-4 mb-2',
        3: 'text-base font-semibold text-indigo-300 mt-3 mb-1.5',
        4: 'text-sm font-semibold text-slate-200 mt-2.5 mb-1',
        5: 'text-xs font-bold uppercase tracking-wider text-slate-300 mt-2 mb-1',
        6: 'text-xs font-semibold text-slate-400 mt-2 mb-1'
      };
      out.push(`<h${level} class="${sizeMap[level]}">${content}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote >
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`
        <blockquote class="my-3 pl-3.5 py-2 border-l-4 border-indigo-500 bg-indigo-500/10 rounded-r-lg text-xs text-slate-200 italic space-y-1">
          ${quoteLines.map((q) => `<p>${parseInlineMarkdown(q)}</p>`).join('')}
        </blockquote>
      `);
      continue;
    }

    // Tablas Markdown | col1 | col2 |
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
    ) {
      const parseRow = (r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => parseInlineMarkdown(c.trim()));

      const headers = parseRow(lines[i]);
      i += 2; // saltar cabecera y fila separadora
      const bodyRows = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }

      out.push(`
        <div class="my-3 overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 border-b border-slate-800 text-slate-200">
                ${headers.map((h) => `<th class="px-3 py-2 font-semibold">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/50">
              ${bodyRows
                .map(
                  (row) => `
                  <tr class="hover:bg-slate-900/40">
                    ${row.map((cell) => `<td class="px-3 py-2 text-slate-300">${cell}</td>`).join('')}
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    // Listas desordenadas y Checklists (- item, * item, - [x] item)
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const rawItem = lines[i].replace(/^\s*[-*+]\s+/, '');
        const checkMatch = rawItem.match(/^\[([ xX])\]\s+(.+)$/);
        if (checkMatch) {
          const checked = checkMatch[1].toLowerCase() === 'x';
          items.push(`
            <li class="flex items-start gap-2 my-1 list-none">
              <span class="mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                checked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }">${checked ? '✓' : ''}</span>
              <span class="${
                checked ? 'line-through text-slate-400' : 'text-slate-200'
              }">${parseInlineMarkdown(checkMatch[2])}</span>
            </li>
          `);
        } else {
          items.push(
            `<li class="ml-4 list-disc text-slate-200 my-1">${parseInlineMarkdown(rawItem)}</li>`
          );
        }
        i++;
      }
      out.push(`<ul class="my-2.5 space-y-1 text-sm">${items.join('')}</ul>`);
      continue;
    }

    // Listas ordenadas (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const rawItem = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push(
          `<li class="ml-5 list-decimal text-slate-200 my-1">${parseInlineMarkdown(rawItem)}</li>`
        );
        i++;
      }
      out.push(`<ol class="my-2.5 space-y-1 text-sm">${items.join('')}</ol>`);
      continue;
    }

    // Párrafo normal
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(parseInlineMarkdown(lines[i].trim()));
      i++;
    }
    if (paraLines.length > 0) {
      out.push(
        `<p class="my-2 text-sm text-slate-300 leading-relaxed">${paraLines.join('<br/>')}</p>`
      );
    } else {
      i++;
    }
  }

  return out.join('\n');
}
