import { StorageService, STORAGE_KEYS } from '../core/storage.js';
import {
  createButton,
  createInput,
  createTextarea,
  createBadge,
  Toast,
  getIcon
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

/**
 * 5. Color Picker & Converter (HEX / RGB / RGBA)
 */
const DEFAULT_COLOR_SWATCHES = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
  '#F43F5E', '#8B5CF6', '#EC4899', '#14B8A6'
];

function clampChannel(val, min = 0, max = 255) {
  const num = Number(val);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [clampChannel(r), clampChannel(g), clampChannel(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function hexToRgb(hexStr) {
  const clean = String(hexStr || '')
    .trim()
    .replace(/^#/, '');
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  return null;
}

function generateShades(r, g, b) {
  const factors = [-0.6, -0.45, -0.3, -0.15, 0, 0.2, 0.4, 0.6, 0.8];
  return factors.map((f) => {
    const nr = f < 0 ? r * (1 + f) : r + (255 - r) * f;
    const ng = f < 0 ? g * (1 + f) : g + (255 - g) * f;
    const nb = f < 0 ? b * (1 + f) : b + (255 - b) * f;
    return {
      r: clampChannel(nr),
      g: clampChannel(ng),
      b: clampChannel(nb),
      hex: rgbToHex(nr, ng, nb)
    };
  });
}

export const ColorPickerTool = {
  id: 'color-picker',
  name: 'Color Picker & Converter',
  description:
    'Selector de colores interactivo que genera valores en formato HEX, RGB, RGBA y PowerFx RGBA con copia rápida al portapapeles.',
  category: 'Utilidades',
  icon: 'palette',
  defaultInstalled: false,

  mount(container) {
    container.innerHTML = '';

    const savedHistory = StorageService.get(STORAGE_KEYS.COLOR_HISTORY, null);
    let history = Array.isArray(savedHistory) && savedHistory.length > 0
      ? savedHistory
      : [...DEFAULT_COLOR_SWATCHES];

    const state = {
      r: 79,
      g: 70,
      b: 229,
      a: 100
    };

    const wrap = document.createElement('div');
    wrap.className =
      'h-full flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar bg-slate-950/40 text-slate-200';

    // Encabezado
    const header = document.createElement('div');
    header.className = 'flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80';
    header.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          ${getIcon('palette')}
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">Color Picker &amp; Converter</h2>
          <p class="text-[11px] text-slate-400">Genera códigos HEX, RGB y RGBA listos para copiar</p>
        </div>
      </div>
    `;

    const headerActions = document.createElement('div');
    headerActions.className = 'flex items-center gap-2';

    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      const eyeDropperBtn = createButton({
        label: 'Cuentagotas',
        icon: 'sparkles',
        variant: 'secondary',
        size: 'xs',
        onClick: async () => {
          try {
            const dropper = new window.EyeDropper();
            const result = await dropper.open();
            const rgb = hexToRgb(result.sRGBHex);
            if (rgb) {
              setColor(rgb.r, rgb.g, rgb.b, state.a, true);
              Toast.success(`Color capturado: ${result.sRGBHex.toUpperCase()}`);
            }
          } catch {
            // Usuario canceló cuentagotas
          }
        }
      });
      headerActions.appendChild(eyeDropperBtn);
    }

    const randomBtn = createButton({
      label: 'Color Aleatorio',
      icon: 'sparkles',
      variant: 'outline',
      size: 'xs',
      onClick: () => {
        const rr = Math.floor(Math.random() * 256);
        const gg = Math.floor(Math.random() * 256);
        const bb = Math.floor(Math.random() * 256);
        setColor(rr, gg, bb, state.a, true);
      }
    });
    headerActions.appendChild(randomBtn);
    header.appendChild(headerActions);

    // Sección principal: Muestra de color + Controles de canal R, G, B, A
    const mainGrid = document.createElement('div');
    mainGrid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-4';

    // Tarjeta izquierda: Vista previa grande + input color nativo
    const previewCard = document.createElement('div');
    previewCard.className =
      'lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3';

    const swatchOuter = document.createElement('div');
    swatchOuter.className =
      'relative w-full h-36 rounded-xl border border-slate-700 overflow-hidden shadow-inner flex items-end justify-between p-3 cursor-pointer group';
    swatchOuter.title = 'Haz clic para abrir el selector de color del sistema';

    const nativeColorInput = document.createElement('input');
    nativeColorInput.type = 'color';
    nativeColorInput.value = '#4F46E5';
    nativeColorInput.className = 'sr-only';

    const swatchOverlay = document.createElement('div');
    swatchOverlay.className = ' inset-0 absolute transition-colors';

    const swatchBadge = document.createElement('span');
    swatchBadge.className =
      'relative z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 font-mono text-xs font-bold text-white';

    const pickHint = document.createElement('span');
    pickHint.className =
      'relative z-10 px-2 py-1 rounded-lg bg-slate-950/75 text-[11px] text-slate-200 opacity-90 group-hover:opacity-100';
    pickHint.textContent = 'Elegir color';

    swatchOuter.append(nativeColorInput, swatchOverlay, swatchBadge, pickHint);
    swatchOuter.addEventListener('click', () => nativeColorInput.click());

    nativeColorInput.addEventListener('input', (e) => {
      const parsed = hexToRgb(e.target.value);
      if (parsed) {
        setColor(parsed.r, parsed.g, parsed.b, state.a, false);
      }
    });
    nativeColorInput.addEventListener('change', (e) => {
      const parsed = hexToRgb(e.target.value);
      if (parsed) {
        setColor(parsed.r, parsed.g, parsed.b, state.a, true);
      }
    });

    // Input manual para pegar un HEX o RGB directamente
    const manualHexInput = createInput({
      label: 'Ingresar HEX manual (#RRGGBB)',
      placeholder: '#4F46E5',
      value: '#4F46E5',
      onInput: (val) => {
        const rgb = hexToRgb(val);
        if (rgb) {
          setColor(rgb.r, rgb.g, rgb.b, state.a, true, { skipHexInput: true });
        }
      }
    });
    manualHexInput.input.classList.add('font-mono', 'text-xs', 'uppercase');

    previewCard.append(swatchOuter, manualHexInput);

    // Tarjeta derecha: Sliders RGB + Alpha
    const slidersCard = document.createElement('div');
    slidersCard.className =
      'lg:col-span-7 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3';

    function createChannelRow(label, channelKey, min, max, accentClass) {
      const row = document.createElement('div');
      row.className = 'space-y-1';

      const top = document.createElement('div');
      top.className = 'flex items-center justify-between text-xs';

      const lbl = document.createElement('span');
      lbl.className = 'font-semibold text-slate-300';
      lbl.textContent = label;

      const valBadge = document.createElement('span');
      valBadge.className = 'font-mono text-xs text-indigo-300 font-bold';

      top.append(lbl, valBadge);

      const controls = document.createElement('div');
      controls.className = 'flex items-center gap-2.5';

      const range = document.createElement('input');
      range.type = 'range';
      range.min = String(min);
      range.max = String(max);
      range.value = String(state[channelKey]);
      range.className = `flex-1 h-2 rounded-lg appearance-none bg-slate-800 cursor-pointer ${accentClass}`;

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = String(min);
      numInput.max = String(max);
      numInput.value = String(state[channelKey]);
      numInput.className =
        'w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-slate-100 outline-none focus:border-indigo-500';

      range.addEventListener('input', () => {
        const v = clampChannel(range.value, min, max);
        state[channelKey] = v;
        setColor(state.r, state.g, state.b, state.a, false);
      });

      range.addEventListener('change', () => {
        setColor(state.r, state.g, state.b, state.a, true);
      });

      numInput.addEventListener('input', () => {
        const v = clampChannel(numInput.value, min, max);
        state[channelKey] = v;
        setColor(state.r, state.g, state.b, state.a, true);
      });

      controls.append(range, numInput);
      row.append(top, controls);

      return { row, range, numInput, valBadge };
    }

    const rRow = createChannelRow('Rojo (R)', 'r', 0, 255, 'accent-rose-500');
    const gRow = createChannelRow('Verde (G)', 'g', 0, 255, 'accent-emerald-500');
    const bRow = createChannelRow('Azul (B)', 'b', 0, 255, 'accent-sky-500');
    const aRow = createChannelRow('Opacidad (Alpha %)', 'a', 0, 100, 'accent-indigo-500');

    slidersCard.append(rRow.row, gRow.row, bRow.row, aRow.row);
    mainGrid.append(previewCard, slidersCard);

    // Sección de valores generados para copiar al portapapeles
    const outputsCard = document.createElement('div');
    outputsCard.className =
      'p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3';

    const outputsTitle = document.createElement('div');
    outputsTitle.className =
      'text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between';
    outputsTitle.innerHTML = `<span>Formatos de Salida (Clic en Copiar)</span>`;

    const outputsGrid = document.createElement('div');
    outputsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

    function createCopyableFormatRow(title) {
      const box = document.createElement('div');
      box.className =
        'p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2';

      const info = document.createElement('div');
      info.className = 'min-w-0 flex-1';

      const labelEl = document.createElement('div');
      labelEl.className = 'text-[10px] font-bold uppercase tracking-wider text-indigo-400';
      labelEl.textContent = title;

      const valueEl = document.createElement('div');
      valueEl.className = 'font-mono text-xs text-slate-100 truncate mt-0.5 select-all';

      info.append(labelEl, valueEl);

      const copyBtn = createButton({
        label: 'Copiar',
        icon: 'copy',
        variant: 'primary',
        size: 'xs',
        onClick: () => {
          navigator.clipboard?.writeText(valueEl.textContent);
          Toast.success(`${title} copiado: ${valueEl.textContent}`);
        }
      });

      box.append(info, copyBtn);
      return { box, valueEl };
    }

    const hexOut = createCopyableFormatRow('HEX');
    const rgbOut = createCopyableFormatRow('RGB');
    const rgbaOut = createCopyableFormatRow('RGBA (CSS)');
    const pfxOut = createCopyableFormatRow('PowerFx RGBA');

    outputsGrid.append(hexOut.box, rgbOut.box, rgbaOut.box, pfxOut.box);
    outputsCard.append(outputsTitle, outputsGrid);

    // Escala de tonos (Tints & Shades) + Historial de colores recientes
    const palettesCard = document.createElement('div');
    palettesCard.className =
      'p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3';

    const shadesHeader = document.createElement('div');
    shadesHeader.className = 'text-xs font-bold uppercase tracking-wider text-slate-300';
    shadesHeader.textContent = 'Variaciones de Luminosidad (Clic para copiar HEX)';

    const shadesRow = document.createElement('div');
    shadesRow.className = 'grid grid-cols-9 gap-1.5';

    const historyHeader = document.createElement('div');
    historyHeader.className =
      'text-xs font-bold uppercase tracking-wider text-slate-300 pt-2 flex items-center justify-between';
    historyHeader.innerHTML = `<span>Historial Reciente (localStorage)</span>`;

    const historyRow = document.createElement('div');
    historyRow.className = 'flex flex-wrap items-center gap-2';

    palettesCard.append(shadesHeader, shadesRow, historyHeader, historyRow);

    function pushToHistory(hexVal) {
      const upper = hexVal.toUpperCase();
      history = [upper, ...history.filter((c) => c.toUpperCase() !== upper)].slice(0, 14);
      StorageService.set(STORAGE_KEYS.COLOR_HISTORY, history);
      renderHistory();
    }

    function renderHistory() {
      historyRow.innerHTML = '';
      history.forEach((hexColor) => {
        const swatchBtn = document.createElement('button');
        swatchBtn.type = 'button';
        swatchBtn.title = `Cargar ${hexColor}`;
        swatchBtn.style.backgroundColor = hexColor;
        swatchBtn.className =
          'w-7 h-7 rounded-lg border border-slate-700 hover:scale-110 transition-transform cursor-pointer shadow-sm';
        swatchBtn.addEventListener('click', () => {
          const parsed = hexToRgb(hexColor);
          if (parsed) {
            setColor(parsed.r, parsed.g, parsed.b, state.a, false);
          }
        });
        historyRow.appendChild(swatchBtn);
      });
    }

    function setColor(r, g, b, a = 100, recordHistory = false, opts = {}) {
      state.r = clampChannel(r, 0, 255);
      state.g = clampChannel(g, 0, 255);
      state.b = clampChannel(b, 0, 255);
      state.a = clampChannel(a, 0, 100);

      const hex = rgbToHex(state.r, state.g, state.b);
      const alphaDec = Number((state.a / 100).toFixed(2));
      const rgbString = `rgb(${state.r}, ${state.g}, ${state.b})`;
      const rgbaString = `rgba(${state.r}, ${state.g}, ${state.b}, ${alphaDec})`;
      const pfxString = `RGBA(${state.r}, ${state.g}, ${state.b}, ${alphaDec})`;

      swatchOverlay.style.backgroundColor = rgbaString;
      swatchBadge.textContent = `${hex} · ${state.a}%`;
      nativeColorInput.value = hex;

      if (!opts.skipHexInput) {
        manualHexInput.setValue(hex);
      }

      rRow.range.value = String(state.r);
      rRow.numInput.value = String(state.r);
      rRow.valBadge.textContent = String(state.r);

      gRow.range.value = String(state.g);
      gRow.numInput.value = String(state.g);
      gRow.valBadge.textContent = String(state.g);

      bRow.range.value = String(state.b);
      bRow.numInput.value = String(state.b);
      bRow.valBadge.textContent = String(state.b);

      aRow.range.value = String(state.a);
      aRow.numInput.value = String(state.a);
      aRow.valBadge.textContent = `${state.a}%`;

      hexOut.valueEl.textContent = hex;
      rgbOut.valueEl.textContent = rgbString;
      rgbaOut.valueEl.textContent = rgbaString;
      pfxOut.valueEl.textContent = pfxString;

      // Renderizar variaciones de tono
      shadesRow.innerHTML = '';
      const shades = generateShades(state.r, state.g, state.b);
      shades.forEach((sh) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.style.backgroundColor = sh.hex;
        cell.title = `Clic para copiar ${sh.hex}`;
        cell.className =
          'h-10 rounded-lg border border-slate-700/80 flex items-end justify-center p-1 group cursor-pointer hover:scale-105 transition-transform';
        cell.innerHTML = `<span class="text-[9px] font-mono px-1 rounded bg-slate-950/75 text-slate-100 truncate">${sh.hex}</span>`;
        cell.addEventListener('click', () => {
          navigator.clipboard?.writeText(sh.hex);
          setColor(sh.r, sh.g, sh.b, state.a, true);
          Toast.success(`Variación ${sh.hex} seleccionada y copiada`);
        });
        shadesRow.appendChild(cell);
      });

      if (recordHistory) {
        pushToHistory(hex);
      }
    }

    renderHistory();
    setColor(state.r, state.g, state.b, state.a, false);

    wrap.append(header, mainGrid, outputsCard, palettesCard);
    container.appendChild(wrap);
  }
};
