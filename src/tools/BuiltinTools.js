import {
  createButton,
  createInput,
  createTextarea,
  createBadge,
  Toast
} from '../components/ui/index.js';

/**
 * 1. JSON Formatter & Validator
 */
export const JsonFormatterTool = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Formatea, minifica y valida estructuras JSON al instante con detección de errores.',
  category: 'Datos',
  icon: 'code',
  defaultInstalled: true,

  mount(container) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'h-full flex flex-col p-3.5 gap-3 overflow-y-auto custom-scrollbar bg-slate-950/30';

    const topRow = document.createElement('div');
    topRow.className = 'flex flex-wrap items-center justify-between gap-2';

    const statusBadge = createBadge({ text: 'Listo', variant: 'info' });
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-1.5';

    const inputArea = createTextarea({
      label: 'Entrada / Salida JSON',
      placeholder: '{"proyecto": "AG-DevTool", "paneles": 6, "activo": true}',
      value: '{\n  "app": "AG-DevTool",\n  "stack": ["Vanilla JS", "HTML5", "Tailwind CSS"],\n  "maxPanels": 6\n}',
      rows: 10,
      mono: true,
      className: 'flex-1'
    });

    const formatBtn = createButton({
      label: 'Formatear (2 esp)',
      variant: 'primary',
      size: 'xs',
      onClick: () => {
        try {
          const parsed = JSON.parse(inputArea.getValue());
          inputArea.setValue(JSON.stringify(parsed, null, 2));
          statusBadge.textContent = 'JSON Válido';
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
          Toast.success('JSON formateado');
        } catch (err) {
          statusBadge.textContent = 'Error de sintaxis';
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-rose-500/15 text-rose-300 border-rose-500/30';
          Toast.error(err.message);
        }
      }
    });

    const minifyBtn = createButton({
      label: 'Minificar',
      variant: 'secondary',
      size: 'xs',
      onClick: () => {
        try {
          const parsed = JSON.parse(inputArea.getValue());
          inputArea.setValue(JSON.stringify(parsed));
          Toast.info('JSON minificado');
        } catch (err) {
          Toast.error('JSON inválido: ' + err.message);
        }
      }
    });

    const copyBtn = createButton({
      label: 'Copiar',
      icon: 'copy',
      variant: 'outline',
      size: 'xs',
      onClick: () => {
        navigator.clipboard?.writeText(inputArea.getValue());
        Toast.success('Copiado al portapapeles');
      }
    });

    actions.append(formatBtn, minifyBtn, copyBtn);
    topRow.append(statusBadge, actions);
    wrap.append(topRow, inputArea);
    container.appendChild(wrap);
  }
};

/**
 * 2. Base64 & URL Codec
 */
export const Base64CodecTool = {
  id: 'base64-codec',
  name: 'Base64 & URL Codec',
  description: 'Codifica y decodifica cadenas en Base64 (UTF-8) y formato URL-encoded.',
  category: 'Codificación',
  icon: 'binary',
  defaultInstalled: false,

  mount(container) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'h-full flex flex-col p-3.5 gap-3 overflow-y-auto custom-scrollbar bg-slate-950/30';

    const sourceField = createTextarea({
      label: 'Texto original / Entrada',
      placeholder: 'Escribe texto plano o una cadena codificada...',
      value: 'Hola desde AG-DevTool 🚀',
      rows: 4,
      mono: true
    });

    const resultField = createTextarea({
      label: 'Resultado',
      placeholder: 'El resultado aparecerá aquí...',
      rows: 4,
      mono: true
    });

    const btnBar = document.createElement('div');
    btnBar.className = 'flex flex-wrap items-center gap-1.5';

    btnBar.append(
      createButton({
        label: 'Base64 Encode',
        variant: 'primary',
        size: 'xs',
        onClick: () => {
          try {
            const bytes = new TextEncoder().encode(sourceField.getValue());
            const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
            resultField.setValue(btoa(binString));
          } catch (e) {
            Toast.error('No se pudo codificar en Base64');
          }
        }
      }),
      createButton({
        label: 'Base64 Decode',
        variant: 'secondary',
        size: 'xs',
        onClick: () => {
          try {
            const binString = atob(sourceField.getValue().trim());
            const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
            resultField.setValue(new TextDecoder().decode(bytes));
          } catch {
            Toast.error('Cadena Base64 inválida');
          }
        }
      }),
      createButton({
        label: 'URL Encode',
        variant: 'outline',
        size: 'xs',
        onClick: () => {
          resultField.setValue(encodeURIComponent(sourceField.getValue()));
        }
      }),
      createButton({
        label: 'URL Decode',
        variant: 'outline',
        size: 'xs',
        onClick: () => {
          try {
            resultField.setValue(decodeURIComponent(sourceField.getValue()));
          } catch {
            Toast.error('URL mal formada');
          }
        }
      })
    );

    wrap.append(sourceField, btnBar, resultField);
    container.appendChild(wrap);
  }
};

/**
 * 3. UUID & Hash Generator
 */
export const UuidHashTool = {
  id: 'uuid-hash-generator',
  name: 'UUID & SHA-256 Generator',
  description: 'Genera identificadores UUID v4 únicos y calcula hashes SHA-256 usando Web Crypto API.',
  category: 'Utilidades',
  icon: 'hash',
  defaultInstalled: false,

  mount(container) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'h-full flex flex-col p-3.5 gap-3 overflow-y-auto custom-scrollbar bg-slate-950/30';

    const makeUuid = () =>
      window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const uuidInput = createInput({
      label: 'UUID v4 Generado',
      value: makeUuid()
    });
    uuidInput.input.classList.add('font-mono', 'text-xs');

    const uuidBtns = document.createElement('div');
    uuidBtns.className = 'flex items-center gap-2';
    uuidBtns.append(
      createButton({
        label: 'Generar nuevo UUID',
        icon: 'sparkles',
        variant: 'primary',
        size: 'xs',
        onClick: () => {
          uuidInput.setValue(makeUuid());
        }
      }),
      createButton({
        label: 'Copiar UUID',
        icon: 'copy',
        variant: 'secondary',
        size: 'xs',
        onClick: () => {
          navigator.clipboard?.writeText(uuidInput.getValue());
          Toast.success('UUID copiado');
        }
      })
    );

    const textToHash = createInput({
      label: 'Texto para calcular SHA-256',
      placeholder: 'Escribe cualquier texto para ver su hash SHA-256...',
      onInput: async (val) => {
        if (!val) {
          hashOutput.setValue('');
          return;
        }
        if (window.crypto?.subtle) {
          const buf = await window.crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(val)
          );
          const hex = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          hashOutput.setValue(hex);
        }
      }
    });

    const hashOutput = createInput({
      label: 'Resultado SHA-256 (Hex)',
      placeholder: 'El digest SHA-256 aparecerá aquí...'
    });
    hashOutput.input.readOnly = true;
    hashOutput.input.classList.add('font-mono', 'text-xs');

    wrap.append(uuidInput, uuidBtns, textToHash, hashOutput);
    container.appendChild(wrap);
  }
};

/**
 * 4. Regex Tester
 */
export const RegexTesterTool = {
  id: 'regex-tester',
  name: 'Regex Tester',
  description: 'Prueba expresiones regulares de JavaScript en tiempo real y visualiza las coincidencias.',
  category: 'Codificación',
  icon: 'terminal',
  defaultInstalled: false,

  mount(container) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'h-full flex flex-col p-3.5 gap-3 overflow-y-auto custom-scrollbar bg-slate-950/30';

    const patternInput = createInput({
      label: 'Expresión Regular (sin barras / /)',
      value: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
      onInput: () => evaluateRegex()
    });
    patternInput.input.classList.add('font-mono', 'text-xs');

    const sampleText = createTextarea({
      label: 'Texto de prueba',
      value: 'Contactos del proyecto: admin@devtool.io, soporte@empresa.com y usuario_invalido@.',
      rows: 4,
      onInput: () => evaluateRegex()
    });

    const outputBox = document.createElement('div');
    outputBox.className =
      'p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1';

    function evaluateRegex() {
      try {
        const reg = new RegExp(patternInput.getValue(), 'g');
        const matches = [...sampleText.getValue().matchAll(reg)].map((m) => m[0]);
        outputBox.innerHTML = `
          <div class="text-indigo-400 font-semibold">${matches.length} coincidencia(s) encontrada(s):</div>
          <div>${matches.length ? matches.map((m) => `<span class="inline-block px-2 py-0.5 mr-1.5 mt-1 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">${m}</span>`).join('') : '<span class="text-slate-500">Sin coincidencias</span>'}</div>
        `;
      } catch (err) {
        outputBox.innerHTML = `<span class="text-rose-400">Expresión inválida: ${err.message}</span>`;
      }
    }

    evaluateRegex();
    wrap.append(patternInput, sampleText, outputBox);
    container.appendChild(wrap);
  }
};
