import {
  createButton,
  createInput,
  createBadge,
  Toast,
  getIcon
} from '../components/ui/index.js';

const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DEFAULT_AUTHOR = 'Josue Navas';

/**
 * Formatea una instancia Date al estándar de sufijos Canvas App:
 * datePart: "Nov 06 2026"
 * timePart: "1121"
 */
function formatCanvasTimestamp(date = new Date()) {
  const month = MONTHS_EN[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    datePart: `${month} ${day} ${year}`,
    timePart: `${hours}${minutes}`
  };
}

/**
 * WS Tool exclusiva de "Navas JMD": Generador de sufijos de canvas app
 */
export const CanvasSuffixGeneratorTool = {
  id: 'canvas-app-suffix-generator',
  name: 'Generador de sufijos de canvas app',
  description: 'Genera rápidamente los sufijos estándar (ORIGIN, PBI, BACKUP, COMMENT) para nombres de aplicaciones Canvas.',
  category: 'Navas JMD',
  icon: 'clock',
  isWsTool: true,
  workspaceId: 'navas-jmd',
  defaultInstalled: true,

  mount(container) {
    container.innerHTML = '';

    let currentTimestamp = new Date();

    const wrap = document.createElement('div');
    wrap.className =
      'h-full flex flex-col p-4 sm:p-5 gap-5 overflow-y-auto custom-scrollbar bg-slate-950/30';

    // Encabezado de la herramienta
    const header = document.createElement('div');
    header.className = 'flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-3.5';
    header.innerHTML = `
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Generador de Sufijos de Canvas App</h2>
        </div>
        <p class="text-xs text-slate-400 mt-1">Genera rápidamente los sufijos estándar para nombres de aplicaciones Canvas.</p>
      </div>
    `;
    const wsBadge = createBadge({ text: 'WS Tool · Navas JMD', variant: 'primary' });
    header.appendChild(wsBadge);

    // Sección de controles: Input de PBI + Botón Actualizar Hora
    const controlsCard = document.createElement('div');
    controlsCard.className =
      'p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-3.5';

    const pbiInput = createInput({
      label: '# Número de PBI (Opcional)',
      placeholder: 'Ej. 12345 (dejar vacío si no aplica PBI)',
      icon: 'hash',
      className: 'max-w-xs',
      onInput: () => {
        currentTimestamp = new Date();
        renderSuffixes();
      },
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          currentTimestamp = new Date();
          renderSuffixes();
          Toast.info('Hora actualizada');
        }
      }
    });
    pbiInput.input.classList.add('font-mono');

    const actionsRow = document.createElement('div');
    actionsRow.className = 'flex flex-wrap items-center gap-2.5 pt-1';

    const updateTimeBtn = createButton({
      label: 'Actualizar Hora',
      icon: 'clock',
      variant: 'primary',
      size: 'sm',
      title: 'Actualizar hora (formato 24h) y regenerar sufijos',
      onClick: () => {
        currentTimestamp = new Date();
        renderSuffixes();
        Toast.info('Hora actualizada');
      }
    });

    actionsRow.append(updateTimeBtn);
    controlsCard.append(pbiInput, actionsRow);

    // Sección de resultados: Sufijos Generados
    const resultsSection = document.createElement('div');
    resultsSection.className = 'space-y-3';

    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'flex items-center justify-between gap-2';
    resultsHeader.innerHTML = `
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
        <span class="text-indigo-400">${getIcon('list')}</span>
        <span>Sufijos Generados</span>
      </div>
    `;

    const modeBadgeWrap = document.createElement('div');
    resultsHeader.appendChild(modeBadgeWrap);

    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'space-y-3';

    resultsSection.append(resultsHeader, rowsContainer);

    function buildSuffixItems(pbiValue, dateObj) {
      const { datePart, timePart } = formatCanvasTimestamp(dateObj);
      const cleanPbi = pbiValue.trim();

      const originItem = {
        key: 'ORIGIN',
        label: 'ORIGIN',
        value: ` - origin - ${DEFAULT_AUTHOR} - ${datePart} ${timePart}`
      };

      const backupItem = {
        key: 'BACKUP',
        label: 'BACKUP',
        value: ` - backup - ${DEFAULT_AUTHOR} - ${datePart} ${timePart}`
      };

      if (!cleanPbi) {
        return [originItem, backupItem];
      }

      const pbiItem = {
        key: 'PBI',
        label: 'PBI',
        value: ` - [${cleanPbi}] - ${DEFAULT_AUTHOR} - ${datePart} ${timePart}`
      };

      const commentItem = {
        key: 'COMMENT',
        label: 'COMMENT FORMAT',
        value: `// CS ${cleanPbi} - ${DEFAULT_AUTHOR} - ${datePart}`
      };

      return [originItem, pbiItem, backupItem, commentItem];
    }

    function renderSuffixes() {
      const pbiValue = pbiInput.getValue().trim();

      modeBadgeWrap.innerHTML = '';
      modeBadgeWrap.appendChild(
        createBadge({
          text: pbiValue
            ? `Con PBI #${pbiValue} (4 sufijos)`
            : 'Sin PBI (2 sufijos: ORIGIN, BACKUP)',
          variant: pbiValue ? 'success' : 'info'
        })
      );

      const items = buildSuffixItems(pbiValue, currentTimestamp);
      rowsContainer.innerHTML = '';

      items.forEach((item) => {
        const rowWrap = document.createElement('div');
        rowWrap.className = 'space-y-1.5';

        const labelEl = document.createElement('div');
        labelEl.className =
          'text-[11px] font-bold uppercase tracking-wider text-indigo-400 select-none';
        labelEl.textContent = item.label;

        const lineBox = document.createElement('div');
        lineBox.className = 'flex items-center gap-2';

        const valueField = createInput({
          value: item.value,
          className: 'flex-1'
        });
        valueField.input.readOnly = true;
        valueField.input.classList.add(
          'font-mono',
          'text-xs',
          'bg-slate-900',
          'text-slate-200',
          'select-all'
        );
        valueField.input.addEventListener('click', () => {
          valueField.input.select();
        });

        const copyBtn = createButton({
          icon: 'copy',
          variant: 'primary',
          size: 'md',
          title: `Copiar línea ${item.key}`,
          className: 'shrink-0 px-3 py-2',
          onClick: () => {
            navigator.clipboard?.writeText(item.value);
            Toast.success(`${item.key} copiado al portapapeles`);
          }
        });

        lineBox.append(valueField, copyBtn);
        rowWrap.append(labelEl, lineBox);
        rowsContainer.appendChild(rowWrap);
      });
    }

    renderSuffixes();

    wrap.append(header, controlsCard, resultsSection);
    container.appendChild(wrap);
  }
};
