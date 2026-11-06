import { getIcon } from './icons.js';

/**
 * Crea un campo Input reutilizable con etiqueta opcional e icono
 */
export function createInput({
  label = '',
  type = 'text',
  placeholder = '',
  value = '',
  icon = null,
  helperText = '',
  required = false,
  className = '',
  onInput = null,
  onKeyDown = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `flex flex-col gap-1.5 ${className}`.trim();

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'text-xs font-medium text-slate-300';
    labelEl.textContent = label + (required ? ' *' : '');
    wrapper.appendChild(labelEl);
  }

  const inputContainer = document.createElement('div');
  inputContainer.className = 'relative flex items-center';

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'absolute left-3 text-slate-400 pointer-events-none';
    iconSpan.innerHTML = getIcon(icon);
    inputContainer.appendChild(iconSpan);
  }

  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.required = required;
  input.className = `w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-lg ${
    icon ? 'pl-9 pr-3' : 'px-3'
  } py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all`;

  if (typeof onInput === 'function') {
    input.addEventListener('input', (e) => onInput(e.target.value, e));
  }
  if (typeof onKeyDown === 'function') {
    input.addEventListener('keydown', onKeyDown);
  }

  inputContainer.appendChild(input);
  wrapper.appendChild(inputContainer);

  if (helperText) {
    const helper = document.createElement('span');
    helper.className = 'text-[11px] text-slate-400';
    helper.textContent = helperText;
    wrapper.appendChild(helper);
  }

  wrapper.input = input;
  wrapper.getValue = () => input.value;
  wrapper.setValue = (v) => {
    input.value = v;
  };
  return wrapper;
}

/**
 * Crea un campo Textarea reutilizable
 */
export function createTextarea({
  label = '',
  placeholder = '',
  value = '',
  rows = 5,
  className = '',
  mono = false,
  onInput = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `flex flex-col gap-1.5 ${className}`.trim();

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'text-xs font-medium text-slate-300';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);
  }

  const textarea = document.createElement('textarea');
  textarea.rows = rows;
  textarea.placeholder = placeholder;
  textarea.value = value;
  textarea.className = `w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all resize-y custom-scrollbar ${
    mono ? 'font-mono text-xs leading-relaxed' : ''
  }`;

  if (typeof onInput === 'function') {
    textarea.addEventListener('input', (e) => onInput(e.target.value, e));
  }

  wrapper.appendChild(textarea);
  wrapper.textarea = textarea;
  wrapper.getValue = () => textarea.value;
  wrapper.setValue = (v) => {
    textarea.value = v;
  };
  return wrapper;
}
