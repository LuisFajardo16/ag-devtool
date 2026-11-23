import { highlightCode, normalizeLanguage } from '../../core/syntaxHighlighter.js';

const AUTO_PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`'
};

const CLOSING_CHARS = new Set(Object.values(AUTO_PAIRS));

/**
 * Inserta o reemplaza un rango de texto intentando preservar el historial nativo de Undo (Ctrl+Z).
 */
function applyTextEdit(ta, start, end, replacement, nextSelStart, nextSelEnd) {
  ta.focus();
  ta.setSelectionRange(start, end);

  let usedExec = false;
  try {
    usedExec = document.execCommand('insertText', false, replacement);
  } catch {
    usedExec = false;
  }

  if (!usedExec) {
    ta.setRangeText(replacement, start, end, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (typeof nextSelStart === 'number' && typeof nextSelEnd === 'number') {
    ta.setSelectionRange(nextSelStart, nextSelEnd);
  }
}

/**
 * Componente de Sistema Reutilizable: Editor de Código con Resaltado de Sintaxis y UX IDE
 * - Resaltado de colores en vivo mediante doble capa sincronizada (<pre><code> + <textarea>)
 * - Captura Tab / Shift+Tab sin perder el foco (línea individual o selección multilínea)
 * - Auto-indentación en Enter, auto-cierre de pares y números de línea sincronizados
 * - Soporta modo auto-ajustable en altura (para BlockEditor) y modo altura completa (para FileManager)
 */
export function createCodeEditor({
  value = '',
  language = 'javascript',
  readOnly = false,
  lineNumbers = true,
  autoResize = false,
  minHeight = 76,
  maxHeight = 460,
  indentSize = 2,
  placeholder = '// Escribe tu código aquí...',
  focusTarget = null,
  className = '',
  onChange = null,
  onKeyDown = null,
  onSave = null
} = {}) {
  let currentLang = normalizeLanguage(language);
  const indentUnit = ' '.repeat(Math.max(1, indentSize));

  const root = document.createElement('div');
  root.className = `ag-code-editor relative flex w-full overflow-hidden rounded-lg bg-slate-950/90 border border-slate-800/80 focus-within:border-indigo-500/60 transition-colors ${
    autoResize ? '' : 'h-full flex-1'
  } ${className}`.trim();

  // Gutter de números de línea
  let gutter = null;
  if (lineNumbers) {
    gutter = document.createElement('div');
    gutter.setAttribute('aria-hidden', 'true');
    gutter.className =
      'ag-code-gutter select-none shrink-0 text-right bg-slate-950/95 border-r border-slate-800/80 text-slate-600 overflow-hidden';
    root.appendChild(gutter);
  }

  // Contenedor superpuesto del código resaltado + textarea transparente
  const stage = document.createElement('div');
  stage.className = 'relative flex-1 min-w-0 overflow-hidden';

  const pre = document.createElement('pre');
  pre.setAttribute('aria-hidden', 'true');
  pre.className = 'ag-code-layer ag-code-highlight pointer-events-none select-none overflow-hidden';

  const codeEl = document.createElement('code');
  pre.appendChild(codeEl);

  const textarea = document.createElement('textarea');
  textarea.className = 'ag-code-layer ag-code-input custom-scrollbar';
  textarea.value = String(value ?? '');
  textarea.readOnly = Boolean(readOnly);
  textarea.placeholder = placeholder;
  textarea.spellcheck = false;
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  if (focusTarget) {
    textarea.setAttribute('data-focus-target', focusTarget);
  }

  stage.append(pre, textarea);
  root.appendChild(stage);

  function syncScroll() {
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
    if (gutter) {
      gutter.scrollTop = textarea.scrollTop;
    }
  }

  function updateHeight() {
    if (!autoResize) return;
    const lineCount = Math.max(1, textarea.value.split('\n').length);
    const lineHeightPx = 20; // 12.5px * 1.6 = 20px (definido en main.css)
    const verticalPadding = 22; // 11px top + 11px bottom
    const ideal = Math.max(minHeight, lineCount * lineHeightPx + verticalPadding);
    const clamped = maxHeight ? Math.min(ideal, maxHeight) : ideal;
    const heightCss = `${clamped}px`;
    root.style.height = heightCss;
    stage.style.height = heightCss;
    textarea.style.overflowY = maxHeight && ideal > maxHeight ? 'auto' : 'hidden';
  }

  function renderHighlight() {
    const val = textarea.value;
    // Añadir espacio invisible al final de salto de línea para que <pre> mantenga la misma altura que <textarea>
    const rendered = highlightCode(val, currentLang);
    codeEl.innerHTML = val.endsWith('\n') ? `${rendered}\n ` : `${rendered} `;

    if (gutter) {
      const count = Math.max(1, val.split('\n').length);
      let nums = '';
      for (let i = 1; i <= count; i++) {
        nums += `<div class="ag-code-line-num">${i}</div>`;
      }
      gutter.innerHTML = nums;
    }

    updateHeight();
    syncScroll();
  }

  // Manejo avanzado de teclado: Tab, Shift+Tab, Enter, pares automáticos, Ctrl+S, Escape
  textarea.addEventListener('keydown', (e) => {
    if (typeof onKeyDown === 'function') {
      const handled = onKeyDown(e, textarea);
      if (handled === true || e.defaultPrevented) {
        return;
      }
    }

    // Ctrl+S / Cmd+S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      if (typeof onSave === 'function') {
        e.preventDefault();
        onSave(textarea.value);
      }
      return;
    }

    // Escape libera explícitamente el foco del editor
    if (e.key === 'Escape') {
      e.preventDefault();
      textarea.blur();
      return;
    }

    if (textarea.readOnly) return;

    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. TAB y SHIFT+TAB: nunca pierde el foco del editor
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();

      if (!e.shiftKey && start === end) {
        applyTextEdit(taRef(), start, end, indentUnit, start + indentUnit.length, start + indentUnit.length);
        return;
      }

      // Calcular líneas cubiertas por la selección
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      let effectiveEnd = end;
      if (end > start && val[end - 1] === '\n') {
        effectiveEnd = end - 1;
      }
      const nextNewline = val.indexOf('\n', effectiveEnd);
      const lineEnd = nextNewline === -1 ? val.length : nextNewline;
      const selectedBlock = val.slice(lineStart, lineEnd);
      const lines = selectedBlock.split('\n');

      if (!e.shiftKey) {
        const indented = lines.map((line) => indentUnit + line).join('\n');
        const newStart = start + indentUnit.length;
        const newEnd = end + indentUnit.length * lines.length;
        applyTextEdit(taRef(), lineStart, lineEnd, indented, newStart, newEnd);
      } else {
        let removedFromFirst = 0;
        let totalRemoved = 0;
        const outdented = lines
          .map((line, idx) => {
            let removeCount = 0;
            if (line.startsWith(indentUnit)) {
              removeCount = indentUnit.length;
            } else if (line.startsWith('\t')) {
              removeCount = 1;
            } else {
              const leadingSpaces = line.match(/^ +/)?.[0]?.length || 0;
              removeCount = Math.min(leadingSpaces, indentUnit.length);
            }
            if (idx === 0) removedFromFirst = removeCount;
            totalRemoved += removeCount;
            return line.slice(removeCount);
          })
          .join('\n');

        if (totalRemoved > 0) {
          const newStart = Math.max(lineStart, start - removedFromFirst);
          const newEnd = Math.max(newStart, end - totalRemoved);
          applyTextEdit(taRef(), lineStart, lineEnd, outdented, newStart, newEnd);
        }
      }
      return;
    }

    // 2. ENTER: auto-indentación inteligente
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const beforeCursor = val.slice(lineStart, start);
      const currentIndent = beforeCursor.match(/^[\t ]*/)?.[0] || '';
      const trimmedBefore = beforeCursor.trimEnd();
      const prevChar = trimmedBefore.slice(-1);
      const nextChar = val[end] || '';

      const opensBlock =
        prevChar === '{' ||
        prevChar === '[' ||
        prevChar === '(' ||
        (prevChar === ':' && (currentLang === 'python' || currentLang === 'yaml'));

      const isMatchingCloser =
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '(' && nextChar === ')');

      if (opensBlock && isMatchingCloser) {
        const insertion = `\n${currentIndent}${indentUnit}\n${currentIndent}`;
        const cursorPos = start + 1 + currentIndent.length + indentUnit.length;
        applyTextEdit(taRef(), start, end, insertion, cursorPos, cursorPos);
      } else if (opensBlock) {
        const insertion = `\n${currentIndent}${indentUnit}`;
        const cursorPos = start + insertion.length;
        applyTextEdit(taRef(), start, end, insertion, cursorPos, cursorPos);
      } else {
        const insertion = `\n${currentIndent}`;
        const cursorPos = start + insertion.length;
        applyTextEdit(taRef(), start, end, insertion, cursorPos, cursorPos);
      }
      return;
    }

    // 3. BACKSPACE dentro de un par vacío (), [], {}, "", '', ``
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prev = val[start - 1];
      const next = val[start];
      if (AUTO_PAIRS[prev] && AUTO_PAIRS[prev] === next) {
        e.preventDefault();
        applyTextEdit(taRef(), start - 1, start + 1, '', start - 1, start - 1);
        return;
      }
    }

    // 4. Saltar carácter de cierre si ya está justo adelante
    if (!e.ctrlKey && !e.metaKey && !e.altKey && start === end && CLOSING_CHARS.has(e.key)) {
      const next = val[start];
      const isQuote = e.key === '"' || e.key === "'" || e.key === '`';
      if (next === e.key && (!isQuote || (val[start - 1] !== '\\' && val[start] === e.key))) {
        if (!isQuote || val.slice(0, start).split(e.key).length % 2 === 0) {
          e.preventDefault();
          textarea.setSelectionRange(start + 1, start + 1);
          return;
        }
      }
    }

    // 5. Auto-cierre de pares y envoltura de selección
    if (!e.ctrlKey && !e.metaKey && !e.altKey && AUTO_PAIRS[e.key]) {
      const closeChar = AUTO_PAIRS[e.key];
      const next = val[end] || '';
      if (start !== end) {
        e.preventDefault();
        const selected = val.slice(start, end);
        applyTextEdit(taRef(), start, end, `${e.key}${selected}${closeChar}`, start + 1, end + 1);
        return;
      }
      const canAutoClose = !next || /[\s)\]},;:]/.test(next);
      const isQuote = e.key === '"' || e.key === "'" || e.key === '`';
      const prev = val[start - 1] || '';
      if (canAutoClose && (!isQuote || !/[A-Za-z0-9_$]/.test(prev))) {
        e.preventDefault();
        applyTextEdit(taRef(), start, end, `${e.key}${closeChar}`, start + 1, start + 1);
      }
    }
  });

  function taRef() {
    return textarea;
  }

  textarea.addEventListener('input', () => {
    renderHighlight();
    if (typeof onChange === 'function') {
      onChange(textarea.value);
    }
  });

  textarea.addEventListener('scroll', syncScroll);

  renderHighlight();

  return {
    element: root,
    textarea,
    getValue: () => textarea.value,
    setValue: (nextVal = '') => {
      textarea.value = String(nextVal ?? '');
      renderHighlight();
    },
    setLanguage: (nextLang = 'plaintext') => {
      currentLang = normalizeLanguage(nextLang);
      renderHighlight();
    },
    setReadOnly: (flag) => {
      textarea.readOnly = Boolean(flag);
    },
    focus: (cursorAtEnd = false) => {
      textarea.focus();
      if (cursorAtEnd) {
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
      }
    },
    refresh: () => renderHighlight()
  };
}
