import {
  createButton,
  createInput,
  createTextarea,
  createBadge,
  createCard,
  Toast,
  getIcon
} from '../components/ui/index.js';

const POWERFX_FUNCTIONS = new Set([
  'If', 'Switch', 'Patch', 'Collect', 'ClearCollect', 'Clear', 'Remove', 'RemoveIf',
  'Update', 'UpdateIf', 'Set', 'UpdateContext', 'Navigate', 'Back', 'Exit',
  'LookUp', 'Filter', 'Sort', 'SortByColumns', 'Search', 'First', 'FirstN',
  'Last', 'LastN', 'Index', 'CountRows', 'CountIf', 'CountA', 'Count', 'Sum',
  'Average', 'Min', 'Max', 'With', 'ForAll', 'Concurrent', 'Coalesce', 'IsBlank',
  'IsEmpty', 'IsBlankOrError', 'IsError', 'IfError', 'Error', 'Notify', 'RGBA',
  'ColorValue', 'ColorFade', 'Text', 'Value', 'Boolean', 'Date', 'DateValue',
  'TimeValue', 'DateTimeValue', 'DateAdd', 'DateDiff', 'Now', 'Today', 'Year',
  'Month', 'Day', 'Hour', 'Minute', 'Second', 'Weekday', 'Trim', 'TrimEnds',
  'Lower', 'Upper', 'Proper', 'Len', 'Left', 'Mid', 'Right', 'Split', 'Concat',
  'Concatenate', 'Substitute', 'Replace', 'StartsWith', 'EndsWith', 'Match',
  'MatchAll', 'IsMatch', 'GUID', 'JSON', 'ParseJSON', 'Table', 'Sequence',
  'AddColumns', 'DropColumns', 'RenameColumns', 'ShowColumns', 'Distinct',
  'GroupBy', 'Ungroup', 'Defaults', 'SubmitForm', 'ResetForm', 'EditForm',
  'NewForm', 'ViewForm', 'Reset', 'Select', 'SetFocus', 'Launch', 'Param',
  'Download', 'Copy', 'Trace', ' Round', 'RoundUp', 'RoundDown', 'Abs', 'Mod',
  'Sqrt', 'Power', 'Exp', 'Ln', 'Rand', 'RandBetween', 'User', 'Self'
]);

const POWERFX_KEYWORDS = new Set([
  'true', 'false', 'Self', 'Parent', 'ThisItem', 'ThisRecord', 'As', 'in',
  'exactin', 'And', 'Or', 'Not', 'Blank', 'App', 'ScreenTransition',
  'NotificationType', 'DisplayMode', 'FormMode', 'Layout', 'Align',
  'VerticalAlign', 'FontWeight', 'BorderStyle', 'Color', 'JSONFormat',
  'TimeUnit', 'SortOrder', 'StartOfWeek', ' ErrorKind'
]);

const SAMPLE_YAML_V1 = `Screens:
  scrOrdenesCompra:
    Properties:
      Fill: =RGBA(15, 23, 42, 1)
      LoadingSpinnerColor: =RGBA(99, 102, 241, 1)
      OnVisible: |
        =Concurrent(
          ClearCollect(colOrdenes, Filter(OrdenesCompra, Estado = "Pendiente")),
          Set(varUsuarioActual, User().Email),
          UpdateContext({ locMostrarFiltros: false })
        )
    Children:
      - lblTituloPantalla:
          Control: Label@2.5.1
          Properties:
            Text: ="Gestión de Órdenes - " & Upper(varUsuarioActual)
            Color: =RGBA(248, 250, 252, 1)
            Size: =18
            FontWeight: =FontWeight.Bold
            X: =24
            Y: =16
      - txtBuscarOrden:
          Control: Classic/TextInput@2.3.2
          Properties:
            HintText: ="Buscar por código o proveedor..."
            Default: =""
            Fill: =RGBA(30, 41, 59, 1)
            BorderColor: =RGBA(71, 85, 105, 1)
      - galOrdenes:
          Control: Gallery@2.15.0
          Variant: Vertical
          Properties:
            Items: =SortByColumns(Filter(colOrdenes, StartsWith(Codigo, txtBuscarOrden.Text)), "FechaCreacion", SortOrder.Descending)
            TemplateSize: =84
      - btnAprobarOrden:
          Control: Classic/Button@2.2.0
          Properties:
            Text: ="Aprobar Orden"
            DisplayMode: =If(IsBlank(galOrdenes.Selected), DisplayMode.Disabled, DisplayMode.Edit)
            Fill: =RGBA(79, 70, 229, 1)
            OnSelect: |
              =If(
                !IsBlank(galOrdenes.Selected),
                Patch(
                  OrdenesCompra,
                  galOrdenes.Selected,
                  { Estado: "Aprobada", FechaAprobacion: Now() }
                );
                Notify("Orden aprobada exitosamente", NotificationType.Success)
              )
      - btnCancelarLegacy:
          Control: Classic/Button@2.2.0
          Properties:
            Text: ="Cancelar"
            OnSelect: =Back()`;

const SAMPLE_YAML_V2 = `Screens:
  scrOrdenesCompra:
    Properties:
      Fill: =RGBA(15, 23, 42, 1)
      LoadingSpinnerColor: =RGBA(16, 185, 129, 1)
      OnVisible: |
        =Concurrent(
          ClearCollect(colOrdenes, Filter(OrdenesCompra, Estado in ["Pendiente", "En Revisión"])),
          Set(varUsuarioActual, Coalesce(User().FullName, User().Email)),
          UpdateContext({ locMostrarFiltros: true, locLimiteMonto: 5000 })
        )
    Children:
      - lblTituloPantalla:
          Control: Label@2.5.1
          Properties:
            Text: ="Gestión de Órdenes · " & Proper(varUsuarioActual)
            Color: =RGBA(248, 250, 252, 1)
            Size: =20
            FontWeight: =FontWeight.Bold
            X: =24
            Y: =16
      - txtBuscarOrden:
          Control: Classic/TextInput@2.3.2
          Properties:
            HintText: ="Buscar por código, RUC o proveedor..."
            Default: =""
            Fill: =RGBA(30, 41, 59, 1)
            BorderColor: =RGBA(99, 102, 241, 1)
      - galOrdenes:
          Control: Gallery@2.15.0
          Variant: Vertical
          Properties:
            Items: =SortByColumns(Filter(colOrdenes, StartsWith(Codigo, txtBuscarOrden.Text) || txtBuscarOrden.Text in Proveedor), "FechaCreacion", SortOrder.Descending)
            TemplateSize: =96
      - btnAprobarOrden:
          Control: Classic/Button@2.2.0
          Properties:
            Text: ="Aprobar Orden (#" & galOrdenes.Selected.Codigo & ")"
            DisplayMode: =If(IsBlank(galOrdenes.Selected) || galOrdenes.Selected.Monto > locLimiteMonto, DisplayMode.Disabled, DisplayMode.Edit)
            Fill: =RGBA(16, 185, 129, 1)
            OnSelect: |
              =With(
                { itemActual: galOrdenes.Selected },
                If(
                  !IsBlank(itemActual),
                  Patch(
                    OrdenesCompra,
                    itemActual,
                    {
                      Estado: "Aprobada",
                      AprobadoPor: varUsuarioActual,
                      FechaAprobacion: Now()
                    }
                  );
                  Notify("Orden " & itemActual.Codigo & " aprobada", NotificationType.Success, 3000)
                )
              )
      - btnExportarJson:
          Control: Classic/Button@2.2.0
          Properties:
            Text: ="Exportar Resumen"
            Fill: =RGBA(51, 65, 85, 1)
            OnSelect: =Set(varExportPayload, JSON(colOrdenes, JSONFormat.IndentFour))`;

const SAMPLE_PFX_V1 = `// Validación y registro de Orden de Compra (Versión Anterior)
If(
    IsBlank(txtProveedor.Text) || Value(txtMontoTotal.Text) <= 0,
    Notify("Complete los campos obligatorios antes de guardar.", NotificationType.Warning),
    UpdateContext({ locGuardando: true });
    Patch(
        OrdenesCompra,
        Defaults(OrdenesCompra),
        {
            Codigo: "OC-" & Text(Now(), "yyyymmdd-hhmm"),
            Proveedor: Trim(txtProveedor.Text),
            Monto: Value(txtMontoTotal.Text),
            Estado: "Pendiente",
            CreadoPor: User().Email,
            FechaCreacion: Now()
        }
    );
    UpdateContext({ locGuardando: false });
    Notify("Orden registrada correctamente", NotificationType.Success);
    Navigate(scrResumenOrdenes, ScreenTransition.Fade)
)`;

const SAMPLE_PFX_V2 = `// Validación y registro de Orden de Compra con control de presupuesto (Versión Nueva)
With(
    {
        montoCapturado: Value(txtMontoTotal.Text),
        proveedorLimpio: TrimEnds(txtProveedor.Text)
    },
    If(
        IsBlank(proveedorLimpio) || montoCapturado <= 0,
        Notify("Verifica el proveedor y un monto mayor a cero.", NotificationType.Error, 3500),
        UpdateContext({ locGuardando: true });
        IfError(
            Patch(
                OrdenesCompra,
                Coalesce(varOrdenSeleccionada, Defaults(OrdenesCompra)),
                {
                    Codigo: Coalesce(varOrdenSeleccionada.Codigo, "OC-" & Text(Now(), "yyyymmdd-hhmmss")),
                    Proveedor: proveedorLimpio,
                    Monto: montoCapturado,
                    RequiereFirmaGerencia: montoCapturado > 5000,
                    Estado: If(montoCapturado > 5000, "En Revisión", "Pendiente"),
                    CreadoPor: User().Email,
                    FechaModificacion: Now()
                }
            ),
            Notify("Error al guardar la orden en el origen de datos.", NotificationType.Error),
            Notify("Orden procesada exitosamente", NotificationType.Success, 2500);
            ResetForm(frmDetalleOrden);
            Navigate(scrResumenOrdenes, ScreenTransition.Cover)
        );
        UpdateContext({ locGuardando: false })
    )
)`;

/**
 * Escapa caracteres HTML especiales de forma segura
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resaltador de sintaxis para fórmulas PowerFx y valores YAML
 */
export function highlightPowerFx(code = '') {
  const raw = String(code ?? '');
  if (!raw) return '<span class="text-slate-600 italic">vacío</span>';

  const tokenRegex =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:""|[^"])*"|'(?:''|[^'])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_.]*(?=\s*\()|\b[A-Za-z_][A-Za-z0-9_]*\b|&&|\|\||<>|<=|>=|==|=|[;,.()[\]{}+\-*/!&|<>:])/g;

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(raw.slice(lastIndex, match.index));
    }

    const token = match[0];
    const escaped = escapeHtml(token);

    if (token.startsWith('//') || token.startsWith('/*')) {
      result += `<span class="text-slate-500 italic">${escaped}</span>`;
    } else if (token.startsWith('"') || token.startsWith("'")) {
      result += `<span class="text-amber-300">${escaped}</span>`;
    } else if (/^\d/.test(token)) {
      result += `<span class="text-purple-300 font-semibold">${escaped}</span>`;
    } else if (
      POWERFX_FUNCTIONS.has(token) ||
      ( match.index + token.length < raw.length &&
        /^\s*\(/.test(raw.slice(match.index + token.length)) &&
        /^[A-Za-z_]/.test(token) )
    ) {
      result += `<span class="text-sky-300 font-semibold">${escaped}</span>`;
    } else if (POWERFX_KEYWORDS.has(token)) {
      result += `<span class="text-indigo-300 font-semibold">${escaped}</span>`;
    } else if (/^(=|&&|\|\||<>|<=|>=|==|[;,.()[\]{}+\-*/!&|<>:])$/.test(token)) {
      result += `<span class="text-cyan-400">${escaped}</span>`;
    } else {
      result += `<span class="text-slate-100">${escaped}</span>`;
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < raw.length) {
    result += escapeHtml(raw.slice(lastIndex));
  }

  return result;
}

/**
 * Parser de YAML jerárquico orientado a Canvas Apps (.fx.yaml) y archivos YAML de configuración
 */
function parseYamlToTree(yamlText = '') {
  const lines = String(yamlText || '').replace(/\r\n/g, '\n').split('\n');
  const root = {
    key: 'root',
    type: 'object',
    value: '',
    children: [],
    childrenMap: new Map()
  };

  const stack = [{ indent: -1, node: root }];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const indent = rawLine.search(/\S/);
    let cleanLine = trimmed;
    let isListItem = false;

    if (cleanLine.startsWith('- ')) {
      isListItem = true;
      cleanLine = cleanLine.slice(2).trim();
    } else if (cleanLine === '-') {
      isListItem = true;
      cleanLine = '';
    }

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;

    const colonIdx = cleanLine.indexOf(':');
    if (colonIdx !== -1) {
      let key = cleanLine.slice(0, colonIdx).trim();
      let rest = cleanLine.slice(colonIdx + 1).trim();

      if (isListItem && !key) {
        key = `item_${parent.children.length + 1}`;
      }

      if (parent.childrenMap.has(key)) {
        let suffix = 2;
        while (parent.childrenMap.has(`${key}#${suffix}`)) {
          suffix++;
        }
        key = `${key}#${suffix}`;
      }

      const node = {
        key,
        isListItem,
        lineStart: i + 1,
        type: 'property',
        value: '',
        children: [],
        childrenMap: new Map()
      };

      // Bloque escalar multilínea (| o >)
      if (rest === '|' || rest === '|-' || rest === '|+' || rest === '>' || rest === '>-') {
        const blockLines = [];
        let blockIndent = null;
        i++;
        while (i < lines.length) {
          const nextRaw = lines[i];
          const nextTrim = nextRaw.trim();
          if (!nextTrim) {
            blockLines.push('');
            i++;
            continue;
          }
          const nextIndent = nextRaw.search(/\S/);
          if (nextIndent <= indent) {
            break;
          }
          if (blockIndent === null) {
            blockIndent = nextIndent;
          }
          blockLines.push(nextRaw.slice(Math.min(blockIndent, nextIndent)));
          i++;
        }
        node.value = blockLines.join('\n').trimEnd();
        node.type = 'property';
        parent.children.push(node);
        parent.childrenMap.set(key, node);
        continue;
      }

      if (rest !== '') {
        // Verifica si las líneas siguientes son continuación indentada de fórmula PowerFx (sin nueva clave YAML)
        const continuationLines = [rest];
        let lookahead = i + 1;
        while (lookahead < lines.length) {
          const nextRaw = lines[lookahead];
          const nextTrim = nextRaw.trim();
          if (!nextTrim) {
            lookahead++;
            continue;
          }
          const nextIndent = nextRaw.search(/\S/);
          if (nextIndent <= indent) break;
          // Si parece un nodo hijo YAML (ej. Propiedad: valor o - Control:) detenemos continuación
          const looksLikeYamlKey =
            /^-?\s*[A-Za-z0-9_."'-]+\s*:(\s|$)/.test(nextTrim) &&
            !rest.startsWith('=');
          if (looksLikeYamlKey) break;
          // Si empieza con guion o clave de control dentro de un objeto contenedor
          if (/^-\s+[A-Za-z0-9_]+\s*:/.test(nextTrim)) break;
          if (
            /^[A-Za-z0-9_]+\s*:/.test(nextTrim) &&
            !nextTrim.includes('://') &&
            !rest.trim().endsWith('(') &&
            !rest.trim().endsWith(',') &&
            !rest.trim().endsWith(';') &&
            !rest.trim().endsWith('&')
          ) {
            break;
          }
          continuationLines.push(nextRaw.slice(indent + 2));
          lookahead++;
        }

        node.value = continuationLines.join('\n');
        node.type = 'property';
        parent.children.push(node);
        parent.childrenMap.set(key, node);
        i = lookahead;
        continue;
      }

      // Es un nodo contenedor (Screen, Control, Properties, Children...)
      node.type = 'object';
      parent.children.push(node);
      parent.childrenMap.set(key, node);
      stack.push({ indent, node });
      i++;
    } else {
      // Valor escalar directo en lista
      const key = `item_${parent.children.length + 1}`;
      const node = {
        key,
        isListItem: true,
        lineStart: i + 1,
        type: 'property',
        value: cleanLine,
        children: [],
        childrenMap: new Map()
      };
      parent.children.push(node);
      parent.childrenMap.set(key, node);
      i++;
    }
  }

  return root;
}

/**
 * Compara recursivamente dos nodos del árbol YAML
 */
function diffYamlNodes(nodeA, nodeB, path = '') {
  const keys = [];
  const seen = new Set();

  if (nodeA?.children) {
    nodeA.children.forEach((c) => {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        keys.push(c.key);
      }
    });
  }
  if (nodeB?.children) {
    nodeB.children.forEach((c) => {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        keys.push(c.key);
      }
    });
  }

  const diffChildren = [];
  const counts = { added: 0, removed: 0, modified: 0, unchanged: 0 };

  keys.forEach((key) => {
    const childA = nodeA?.childrenMap?.get(key) || null;
    const childB = nodeB?.childrenMap?.get(key) || null;
    const currentPath = path ? `${path}.${key}` : key;

    if (childA && !childB) {
      const sub = diffYamlNodes(childA, null, currentPath);
      const item = {
        key,
        path: currentPath,
        status: 'removed',
        isListItem: childA.isListItem,
        oldValue: childA.value || '',
        newValue: '',
        hasChildren: sub.children.length > 0,
        children: sub.children
      };
      counts.removed += 1 + sub.counts.removed;
      diffChildren.push(item);
    } else if (!childA && childB) {
      const sub = diffYamlNodes(null, childB, currentPath);
      const item = {
        key,
        path: currentPath,
        status: 'added',
        isListItem: childB.isListItem,
        oldValue: '',
        newValue: childB.value || '',
        hasChildren: sub.children.length > 0,
        children: sub.children
      };
      counts.added += 1 + sub.counts.added;
      diffChildren.push(item);
    } else {
      const sub = diffYamlNodes(childA, childB, currentPath);
      const valA = String(childA.value ?? '');
      const valB = String(childB.value ?? '');
      const directValueChanged = valA !== valB;
      const descendantChanged =
        sub.counts.added > 0 || sub.counts.removed > 0 || sub.counts.modified > 0;

      let status = 'unchanged';
      if (directValueChanged || descendantChanged) {
        status = 'modified';
      }

      if (directValueChanged) {
        counts.modified += 1;
      } else if (! sub.children.length) {
        counts.unchanged += 1;
      }

      counts.added += sub.counts.added;
      counts.removed += sub.counts.removed;
      counts.modified += sub.counts.modified;
      counts.unchanged += sub.counts.unchanged;

      diffChildren.push({
        key,
        path: currentPath,
        status,
        directValueChanged,
        isListItem: Boolean(childB.isListItem || childA.isListItem),
        oldValue: valA,
        newValue: valB,
        hasChildren: sub.children.length > 0,
        children: sub.children
      });
    }
  });

  return { children: diffChildren, counts };
}

/**
 * Calcula el diff de líneas mediante LCS (Longest Common Subsequence)
 */
function computeLineDiff(textA = '', textB = '') {
  const linesA = String(textA ?? '').replace(/\r\n/g, '\n').split('\n');
  const linesB = String(textB ?? '').replace(/\r\n/g, '\n').split('\n');

  if (textA === '' && textB === '') {
    return { rows: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
  }

  const m = linesA.length;
  const n = linesB.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (linesA[i] === linesB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawOps = [];
  let i = 0;
  let j = 0;
  let lineNumA = 1;
  let lineNumB = 1;

  while (i < m && j < n) {
    if (linesA[i] === linesB[j]) {
      rawOps.push({
        type: 'unchanged',
        oldLineNumber: lineNumA++,
        newLineNumber: lineNumB++,
        oldText: linesA[i],
        newText: linesB[j]
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawOps.push({
        type: 'removed',
        oldLineNumber: lineNumA++,
        newLineNumber: null,
        oldText: linesA[i],
        newText: ''
      });
      i++;
    } else {
      rawOps.push({
        type: 'added',
        oldLineNumber: null,
        newLineNumber: lineNumB++,
        oldText: '',
        newText: linesB[j]
      });
      j++;
    }
  }

  while (i < m) {
    rawOps.push({
      type: 'removed',
      oldLineNumber: lineNumA++,
      newLineNumber: null,
      oldText: linesA[i++],
      newText: ''
    });
  }

  while (j < n) {
    rawOps.push({
      type: 'added',
      oldLineNumber: null,
      newLineNumber: lineNumB++,
      oldText: '',
      newText: linesB[j++]
    });
  }

  // Emparejar bloques consecutivos removed + added como filas "modified" para vista Side-by-Side
  const pairedRows = [];
  const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };

  let idx = 0;
  while (idx < rawOps.length) {
    if (rawOps[idx].type === 'unchanged') {
      pairedRows.push(rawOps[idx]);
      stats.unchanged++;
      idx++;
      continue;
    }

    const removedBatch = [];
    const addedBatch = [];

    while (idx < rawOps.length && rawOps[idx].type === 'removed') {
      removedBatch.push(rawOps[idx]);
      idx++;
    }
    while (idx < rawOps.length && rawOps[idx].type === 'added') {
      addedBatch.push(rawOps[idx]);
      idx++;
    }

    const maxLen = Math.max(removedBatch.length, addedBatch.length);
    for (let k = 0; k < maxLen; k++) {
      const rem = removedBatch[k];
      const add = addedBatch[k];
      if (rem && add) {
        pairedRows.push({
          type: 'modified',
          oldLineNumber: rem.oldLineNumber,
          newLineNumber: add.newLineNumber,
          oldText: rem.oldText,
          newText: add.newText
        });
        stats.modified++;
      } else if (rem) {
        pairedRows.push(rem);
        stats.removed++;
      } else if (add) {
        pairedRows.push(add);
        stats.added++;
      }
    }
  }

  return { rows: pairedRows, rawOps, stats };
}

/**
 * WS Tool exclusiva de "Navas JMD": YAML PowerFx Diff
 */
export const YamlPowerFxDiffTool = {
  id: 'yaml-powerfx-diff',
  name: 'YAML PowerFx Diff',
  description:
    'Compara dos versiones de código YAML (Canvas App) o PowerFx mostrando el árbol de nodos modificados y resaltando siempre la sintaxis PowerFx.',
  category: 'Navas JMD',
  icon: 'gitDiff',
  isWsTool: true,
  workspaceId: 'navas-jmd',
  defaultInstalled: true,

  mount(container) {
    container.innerHTML = '';

    const state = {
      mode: 'yaml', // 'yaml' | 'powerfx'
      treeFilter: 'all', // 'all' | 'modified'
      codeDiffLayout: 'split', // 'split' | 'unified'
      inputsCollapsed: false,
      searchQuery: '',
      selectedNodePath: null,
      collapsedPaths: new Set(),
      textA: SAMPLE_YAML_V1,
      textB: SAMPLE_YAML_V2
    };

    const root = document.createElement('div');
    root.className = 'h-full w-full flex flex-col overflow-hidden bg-slate-950/60';

    // 1. Barra Superior de la Herramienta
    const topBar = document.createElement('div');
    topBar.className =
      'px-4 py-3 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'flex items-center gap-2.5 min-w-0';
    titleGroup.innerHTML = `
      <div class="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
        ${getIcon('gitDiff')}
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-sm font-bold text-slate-100 truncate">YAML &amp; PowerFx Diff</h2>
        </div>
        <p class="text-[11px] text-slate-400 truncate">
          Comparador de árbol de nodos YAML y código PowerFx con resaltado de sintaxis
        </p>
      </div>
    `;
    titleGroup
      .querySelector('.flex.items-center.gap-2')
      .appendChild(createBadge({ text: 'Navas JMD · WS Tool', variant: 'info' }));

    const controlsGroup = document.createElement('div');
    controlsGroup.className = 'flex flex-wrap items-center gap-2';

    // Selector de Modo: YAML vs PowerFx
    const modeSwitchWrap = document.createElement('div');
    modeSwitchWrap.className =
      'inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800';

    const yamlModeBtn = document.createElement('button');
    yamlModeBtn.type = 'button';
    const pfxModeBtn = document.createElement('button');
    pfxModeBtn.type = 'button';

    function updateModeButtonsUI() {
      const isYaml = state.mode === 'yaml';
      yamlModeBtn.className = `px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
        isYaml
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      yamlModeBtn.innerHTML = `${getIcon('folderTree')} <span>YAML (Árbol de Nodos)</span>`;

      pfxModeBtn.className = `px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
        !isYaml
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      pfxModeBtn.innerHTML = `${getIcon('code')} <span>PowerFx (Código)</span>`;
    }

    yamlModeBtn.addEventListener('click', () => {
      if (state.mode !== 'yaml') {
        state.mode = 'yaml';
        if (state.textA === SAMPLE_PFX_V1 && state.textB === SAMPLE_PFX_V2) {
          state.textA = SAMPLE_YAML_V1;
          state.textB = SAMPLE_YAML_V2;
          editorA.setValue(state.textA);
          editorB.setValue(state.textB);
        }
        updateModeButtonsUI();
        renderDiffOutput();
      }
    });

    pfxModeBtn.addEventListener('click', () => {
      if (state.mode !== 'powerfx') {
        state.mode = 'powerfx';
        if (state.textA === SAMPLE_YAML_V1 && state.textB === SAMPLE_YAML_V2) {
          state.textA = SAMPLE_PFX_V1;
          state.textB = SAMPLE_PFX_V2;
          editorA.setValue(state.textA);
          editorB.setValue(state.textB);
        }
        updateModeButtonsUI();
        renderDiffOutput();
      }
    });

    modeSwitchWrap.append(yamlModeBtn, pfxModeBtn);

    const loadSampleBtn = createButton({
      label: 'Ejemplo',
      icon: 'sparkles',
      variant: 'secondary',
      size: 'xs',
      title: 'Cargar ejemplo del modo actual',
      onClick: () => {
        if (state.mode === 'yaml') {
          state.textA = SAMPLE_YAML_V1;
          state.textB = SAMPLE_YAML_V2;
        } else {
          state.textA = SAMPLE_PFX_V1;
          state.textB = SAMPLE_PFX_V2;
        }
        state.selectedNodePath = null;
        editorA.setValue(state.textA);
        editorB.setValue(state.textB);
        renderDiffOutput();
        Toast.info(`Ejemplo de ${state.mode === 'yaml' ? 'YAML' : 'PowerFx'} cargado`);
      }
    });

    const swapBtn = createButton({
      label: 'Intercambiar A ↔ B',
      icon: 'arrowsExchange',
      variant: 'outline',
      size: 'xs',
      title: 'Intercambiar Versión Original (A) y Versión Modificada (B)',
      onClick: () => {
        const temp = state.textA;
        state.textA = state.textB;
        state.textB = temp;
        editorA.setValue(state.textA);
        editorB.setValue(state.textB);
        renderDiffOutput();
        Toast.info('Versiones A y B intercambiadas');
      }
    });

    const clearBtn = createButton({
      label: 'Limpiar',
      icon: 'trash',
      variant: 'ghost',
      size: 'xs',
      title: 'Vaciar ambos editores',
      onClick: () => {
        state.textA = '';
        state.textB = '';
        state.selectedNodePath = null;
        editorA.setValue('');
        editorB.setValue('');
        renderDiffOutput();
      }
    });

    let toggleInputsBtn = null;
    function updateToggleInputsBtn() {
      if (!toggleInputsBtn) return;
      toggleInputsBtn.innerHTML = `
        <span class="inline-flex shrink-0">${getIcon(
          state.inputsCollapsed ? 'chevronDown' : 'minimize'
        )}</span>
        <span class="truncate">${
          state.inputsCollapsed ? 'Mostrar Entradas' : 'Ocultar Entradas'
        }</span>
      `;
    }

    toggleInputsBtn = createButton({
      label: 'Ocultar Entradas',
      icon: 'minimize',
      variant: 'secondary',
      size: 'xs',
      onClick: () => {
        state.inputsCollapsed = !state.inputsCollapsed;
        inputsSection.classList.toggle('hidden', state.inputsCollapsed);
        updateToggleInputsBtn();
      }
    });

    controlsGroup.append(
      modeSwitchWrap,
      loadSampleBtn,
      swapBtn,
      clearBtn,
      toggleInputsBtn
    );
    topBar.append(titleGroup, controlsGroup);

    // 2. Sección de Paneles de Entrada (Versión A y Versión B)
    const inputsSection = document.createElement('div');
    inputsSection.className =
      'px-4 py-3 bg-slate-900/50 border-b border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0';

    const editorA = createTextarea({
      label: 'Versión A (Original / Base)',
      placeholder: 'Pega aquí el código YAML o PowerFx original...',
      value: state.textA,
      rows: 5,
      mono: true,
      onInput: (val) => {
        state.textA = val;
        renderDiffOutput();
      }
    });

    const editorB = createTextarea({
      label: 'Versión B (Modificada / Nueva)',
      placeholder: 'Pega aquí el código YAML o PowerFx modificado...',
      value: state.textB,
      rows: 5,
      mono: true,
      onInput: (val) => {
        state.textB = val;
        renderDiffOutput();
      }
    });

    inputsSection.append(editorA, editorB);

    // 3. Barra de Filtros de Diff + Estadísticas + Buscador
    const filterBar = document.createElement('div');
    filterBar.className =
      'px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0';

    const statsContainer = document.createElement('div');
    statsContainer.className = 'flex flex-wrap items-center gap-1.5';

    const viewOptionsContainer = document.createElement('div');
    viewOptionsContainer.className = 'flex flex-wrap items-center gap-2';

    const searchInput = createInput({
      placeholder: 'Filtrar nodo o código...',
      icon: 'search',
      value: state.searchQuery,
      className: 'w-48 sm:w-56',
      onInput: (val) => {
        state.searchQuery = val.trim().toLowerCase();
        renderDiffOutput();
      }
    });
    searchInput.input.classList.remove('py-2', 'text-sm');
    searchInput.input.classList.add('py-1', 'text-xs');

    filterBar.append(statsContainer, viewOptionsContainer);

    // 4. Contenedor Principal de Resultados
    const outputArea = document.createElement('div');
    outputArea.className = 'flex-1 min-h-0 overflow-hidden flex flex-col';

    /**
     * Renderiza las píldoras de estadísticas de cambios
     */
    function renderStatsBadges(counts, unitLabel = 'nodos') {
      statsContainer.innerHTML = '';

      const totalChanges = counts.added + counts.modified + counts.removed;
      statsContainer.appendChild(
        createBadge({
          text:
            totalChanges === 0
              ? `Sin diferencias (${counts.unchanged} ${unitLabel})`
              : `${totalChanges} cambio${totalChanges === 1 ? '' : 's'} detectado${
                  totalChanges === 1 ? '' : 's'
                }`,
          variant: totalChanges === 0 ? 'default' : 'primary'
        })
      );

      if (counts.added > 0 || totalChanges > 0) {
        statsContainer.appendChild(
          createBadge({
            text: `+${counts.added} Agregado${counts.added === 1 ? '' : 's'}`,
            variant: 'success'
          })
        );
      }
      if (counts.modified > 0 || totalChanges > 0) {
        statsContainer.appendChild(
          createBadge({
            text: `~${counts.modified} Modificado${counts.modified === 1 ? '' : 's'}`,
            variant: 'warning'
          })
        );
      }
      if (counts.removed > 0 || totalChanges > 0) {
        statsContainer.appendChild(
          createBadge({
            text: `-${counts.removed} Eliminado${counts.removed === 1 ? '' : 's'}`,
            variant: 'danger'
          })
        );
      }
      statsContainer.appendChild(
        createBadge({
          text: `=${counts.unchanged} Sin cambios`,
          variant: 'default'
        })
      );
    }

    /**
     * Renderiza el diff de una fórmula PowerFx (usado tanto en el inspector de un nodo YAML como en el modo PowerFx)
     */
    function buildPowerFxDiffElement(oldCode, newCode, { compact = false } = {}) {
      const { rows, rawOps } = computeLineDiff(oldCode, newCode);
      const wrap = document.createElement('div');
      wrap.className =
        'rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden font-mono text-xs';

      if (rows.length === 0) {
        wrap.innerHTML = `<div class="p-4 text-center text-slate-500 font-sans">Sin contenido para comparar.</div>`;
        return wrap;
      }

      if (state.codeDiffLayout === 'split') {
        const headerGrid = document.createElement('div');
        headerGrid.className =
          'grid grid-cols-2 border-b border-slate-800 bg-slate-900/90 text-[11px] font-sans font-semibold text-slate-300';
        headerGrid.innerHTML = `
          <div class="px-3 py-1.5 border-r border-slate-800 flex items-center justify-between">
            <span class="text-rose-300">Versión A (Anterior)</span>
            <span class="text-[10px] text-slate-500">PowerFx</span>
          </div>
          <div class="px-3 py-1.5 flex items-center justify-between">
            <span class="text-emerald-300">Versión B (Nueva)</span>
            <span class="text-[10px] text-slate-500">PowerFx</span>
          </div>
        `;
        wrap.appendChild(headerGrid);

        const bodyRows = document.createElement('div');
        bodyRows.className = 'divide-y divide-slate-900/80 overflow-x-auto custom-scrollbar';

        rows.forEach((row) => {
          if (
            state.searchQuery &&
            !`${row.oldText} ${row.newText}`.toLowerCase().includes(state.searchQuery)
          ) {
            return;
          }

          const lineEl = document.createElement('div');
          lineEl.className = 'grid grid-cols-2 min-w-[540px]';

          // Celda izquierda (Versión A)
          let leftBg = 'bg-transparent';
          let leftIndicator = ' ';
          if (row.type === 'removed') {
            leftBg = 'bg-rose-950/45 border-l-2 border-rose-500';
            leftIndicator = '-';
          } else if (row.type === 'modified') {
            leftBg = 'bg-amber-950/35 border-l-2 border-amber-500';
            leftIndicator = '~';
          } else if (row.type === 'added') {
            leftBg = 'bg-slate-950/40 opacity-40';
          }

          // Celda derecha (Versión B)
          let rightBg = 'bg-transparent';
          let rightIndicator = ' ';
          if (row.type === 'added') {
            rightBg = 'bg-emerald-950/45 border-l-2 border-emerald-500';
            rightIndicator = '+';
          } else if (row.type === 'modified') {
            rightBg = 'bg-emerald-950/35 border-l-2 border-emerald-400';
            rightIndicator = '~';
          } else if (row.type === 'removed') {
            rightBg = 'bg-slate-950/40 opacity-40';
          }

          const leftHtml =
            row.oldLineNumber !== null
              ? highlightPowerFx(row.oldText)
              : '<span class="text-slate-700 select-none">·</span>';

          const rightHtml =
            row.newLineNumber !== null
              ? highlightPowerFx(row.newText)
              : '<span class="text-slate-700 select-none">·</span>';

          lineEl.innerHTML = `
            <div class="flex items-start px-2 py-1 border-r border-slate-800/80 ${leftBg}">
              <span class="w-6 shrink-0 text-[10px] text-slate-500 select-none text-right pr-1.5">${
                row.oldLineNumber ?? ''
              }</span>
              <span class="w-4 shrink-0 font-bold select-none ${
                row.type === 'removed'
                  ? 'text-rose-400'
                  : row.type === 'modified'
                  ? 'text-amber-400'
                  : 'text-slate-600'
              }">${leftIndicator}</span>
              <pre class="flex-1 whitespace-pre-wrap break-all leading-relaxed">${leftHtml}</pre>
            </div>
            <div class="flex items-start px-2 py-1 ${rightBg}">
              <span class="w-6 shrink-0 text-[10px] text-slate-500 select-none text-right pr-1.5">${
                row.newLineNumber ?? ''
              }</span>
              <span class="w-4 shrink-0 font-bold select-none ${
                row.type === 'added' || row.type === 'modified'
                  ? 'text-emerald-400'
                  : 'text-slate-600'
              }">${rightIndicator}</span>
              <pre class="flex-1 whitespace-pre-wrap break-all leading-relaxed">${rightHtml}</pre>
            </div>
          `;
          bodyRows.appendChild(lineEl);
        });

        wrap.appendChild(bodyRows);
      } else {
        // Vista Unificada (Inline)
        const bodyRows = document.createElement('div');
        bodyRows.className = 'divide-y divide-slate-900/80 overflow-x-auto custom-scrollbar';

        (rawOps || []).forEach((op) => {
          const textContent = op.type === 'removed' ? op.oldText : op.newText;
          if (
            state.searchQuery &&
            !textContent.toLowerCase().includes(state.searchQuery)
          ) {
            return;
          }

          let rowBg = 'bg-transparent';
          let symbol = ' ';
          let symbolColor = 'text-slate-600';

          if (op.type === 'added') {
            rowBg = 'bg-emerald-950/45 border-l-2 border-emerald-500';
            symbol = '+';
            symbolColor = 'text-emerald-400';
          } else if (op.type === 'removed') {
            rowBg = 'bg-rose-950/45 border-l-2 border-rose-500';
            symbol = '-';
            symbolColor = 'text-rose-400';
          }

          const lineEl = document.createElement('div');
          lineEl.className = `flex items-start px-3 py-1 ${rowBg}`;
          lineEl.innerHTML = `
            <span class="w-7 shrink-0 text-[10px] text-slate-500 select-none text-right pr-2">${
              op.oldLineNumber ?? ''
            }</span>
            <span class="w-7 shrink-0 text-[10px] text-slate-500 select-none text-right pr-2">${
              op.newLineNumber ?? ''
            }</span>
            <span class="w-4 shrink-0 font-bold select-none ${symbolColor}">${symbol}</span>
            <pre class="flex-1 whitespace-pre-wrap break-all leading-relaxed">${highlightPowerFx(
              textContent
            )}</pre>
          `;
          bodyRows.appendChild(lineEl);
        });

        wrap.appendChild(bodyRows);
      }

      return wrap;
    }

    /**
     * Filtra recursivamente los nodos del árbol YAML según "Árbol Completo" vs "Solo Nodos Modificados" y búsqueda
     */
    function filterYamlTreeNodes(nodes) {
      const result = [];

      nodes.forEach((node) => {
        const filteredChildren = filterYamlTreeNodes(node.children || []);
        const matchesMode =
          state.treeFilter === 'all' || node.status !== 'unchanged' || filteredChildren.length > 0;

        if (!matchesMode) return;

        if (state.searchQuery) {
          const selfMatches =
            node.key.toLowerCase().includes(state.searchQuery) ||
            node.path.toLowerCase().includes(state.searchQuery) ||
            String(node.oldValue || '').toLowerCase().includes(state.searchQuery) ||
            String(node.newValue || '').toLowerCase().includes(state.searchQuery);

          if (!selfMatches && filteredChildren.length === 0) {
            return;
          }
        }

        result.push({
          ...node,
          children: filteredChildren
        });
      });

      return result;
    }

    /**
     * Busca un nodo por su path en el árbol
     */
    function findNodeByPath(nodes, targetPath) {
      for (const n of nodes) {
        if (n.path === targetPath) return n;
        if (n.children?.length) {
          const found = findNodeByPath(n.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    }

    /**
     * Obtiene el primer nodo con cambios para seleccionarlo automáticamente en el inspector
     */
    function findFirstChangedNode(nodes) {
      for (const n of nodes) {
        if (n.directValueChanged || (!n.hasChildren && n.status !== 'unchanged')) {
          return n;
        }
        if (n.children?.length) {
          const childChanged = findFirstChangedNode(n.children);
          if (childChanged) return childChanged;
        }
      }
      return nodes[0] || null;
    }

    /**
     * Renderiza la salida principal dependiendo del modo activo (YAML Árbol vs PowerFx Código)
     */
    function renderDiffOutput() {
      viewOptionsContainer.innerHTML = '';
      outputArea.innerHTML = '';

      // Selector de Layout para el código (Dividido vs Unificado)
      const layoutToggle = document.createElement('div');
      layoutToggle.className =
        'inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]';

      const splitBtn = document.createElement('button');
      splitBtn.type = 'button';
      splitBtn.textContent = 'Side-by-Side';
      splitBtn.className = `px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
        state.codeDiffLayout === 'split'
          ? 'bg-slate-800 text-indigo-300'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      splitBtn.addEventListener('click', () => {
        state.codeDiffLayout = 'split';
        renderDiffOutput();
      });

      const unifiedBtn = document.createElement('button');
      unifiedBtn.type = 'button';
      unifiedBtn.textContent = 'Unificado';
      unifiedBtn.className = `px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
        state.codeDiffLayout === 'unified'
          ? 'bg-slate-800 text-indigo-300'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      unifiedBtn.addEventListener('click', () => {
        state.codeDiffLayout = 'unified';
        renderDiffOutput();
      });

      layoutToggle.append(splitBtn, unifiedBtn);

      if (state.mode === 'yaml') {
        // Controles exclusivos de vista de Árbol YAML: "Árbol Completo" vs "Solo Nodos Modificados"
        const treeFilterToggle = document.createElement('div');
        treeFilterToggle.className =
          'inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]';

        const allNodesBtn = document.createElement('button');
        allNodesBtn.type = 'button';
        allNodesBtn.textContent = 'Árbol Completo';
        allNodesBtn.className = `px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
          state.treeFilter === 'all'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`;
        allNodesBtn.addEventListener('click', () => {
          state.treeFilter = 'all';
          renderDiffOutput();
        });

        const modifiedOnlyBtn = document.createElement('button');
        modifiedOnlyBtn.type = 'button';
        modifiedOnlyBtn.textContent = 'Solo Nodos Modificados';
        modifiedOnlyBtn.className = `px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
          state.treeFilter === 'modified'
            ? 'bg-amber-500 text-slate-950'
            : 'text-slate-400 hover:text-slate-200'
        }`;
        modifiedOnlyBtn.addEventListener('click', () => {
          state.treeFilter = 'modified';
          renderDiffOutput();
        });

        treeFilterToggle.append(allNodesBtn, modifiedOnlyBtn);
        viewOptionsContainer.append(treeFilterToggle, layoutToggle, searchInput);

        // Parsear y comparar árboles YAML
        const treeA = parseYamlToTree(state.textA);
        const treeB = parseYamlToTree(state.textB);
        const { children: fullDiffTree, counts } = diffYamlNodes(treeA, treeB);

        renderStatsBadges(counts, 'nodos');

        const visibleNodes = filterYamlTreeNodes(fullDiffTree);

        if (!state.selectedNodePath || !findNodeByPath(fullDiffTree, state.selectedNodePath)) {
          const initialTarget = findFirstChangedNode(visibleNodes) || visibleNodes[0] || null;
          state.selectedNodePath = initialTarget ? initialTarget.path : null;
        }

        const splitWorkspace = document.createElement('div');
        splitWorkspace.className =
          'flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800/90';

        // Columna Izquierda: Árbol de Nodos YAML (5 columnas en lg)
        const treeColumn = document.createElement('div');
        treeColumn.className = 'lg:col-span-5 flex flex-col min-h-0 overflow-hidden bg-slate-950/40';

        const treeHeader = document.createElement('div');
        treeHeader.className =
          'px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0';
        treeHeader.innerHTML = `
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span class="text-indigo-400">${getIcon('folderTree')}</span>
            <span>Árbol de Nodos YAML</span>
          </div>
        `;

        const treeActions = document.createElement('div');
        treeActions.className = 'flex items-center gap-1';

        const expandAllBtn = createButton({
          label: 'Expandir',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            state.collapsedPaths.clear();
            renderDiffOutput();
          }
        });

        const collapseAllBtn = createButton({
          label: 'Colapsar',
          variant: 'ghost',
          size: 'xs',
          onClick: () => {
            function collectContainerPaths(list) {
              list.forEach((n) => {
                if (n.children?.length) {
                  state.collapsedPaths.add(n.path);
                  collectContainerPaths(n.children);
                }
              });
            }
            collectContainerPaths(fullDiffTree);
            renderDiffOutput();
          }
        });

        treeActions.append(expandAllBtn, collapseAllBtn);
        treeHeader.appendChild(treeActions);

        const treeScroll = document.createElement('div');
        treeScroll.className = 'flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1';

        if (visibleNodes.length === 0) {
          treeScroll.innerHTML = `
            <div class="p-6 text-center text-xs text-slate-500">
              ${
                state.treeFilter === 'modified'
                  ? 'No se encontraron nodos modificados entre ambas versiones.'
                  : 'Pega dos estructuras YAML para visualizar el árbol de diferencias.'
              }
            </div>
          `;
        } else {
          function renderTreeNode(node, depth = 0) {
            const nodeWrap = document.createElement('div');
            nodeWrap.className = ' select-none';

            const isSelected = state.selectedNodePath === node.path;
            const isCollapsed = state.collapsedPaths.has(node.path);
            const hasChildren = Array.isArray(node.children) && node.children.length > 0;

            // Estilos semánticos según el estado del diff del nodo
            let statusClasses = 'text-slate-300 hover:bg-slate-800/60 border-transparent';
            let statusSymbol = '·';
            let statusBadgeClass = 'bg-slate-800 text-slate-400 border-slate-700';

            if (node.status === 'added') {
              statusClasses =
                'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
              statusSymbol = '+';
              statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            } else if (node.status === 'removed') {
              statusClasses =
                'bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-500/30';
              statusSymbol = '-';
              statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            } else if (node.status === 'modified') {
              statusClasses =
                'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border-amber-500/30';
              statusSymbol = '~';
              statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            }

            if (isSelected) {
              statusClasses += ' ring-2 ring-indigo-500/70 bg-indigo-600/20';
            }

            const rowBtn = document.createElement('div');
            rowBtn.style.paddingLeft = `${depth * 14 + 8}px`;
            rowBtn.className = `w-full flex items-center justify-between gap-2 pr-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${statusClasses}`;

            const leftPart = document.createElement('div');
            leftPart.className = 'flex items-center gap-1.5 min-w-0 flex-1';

            if (hasChildren) {
              const toggleCaret = document.createElement('span');
              toggleCaret.className =
                'w-4 h-4 inline-flex items-center justify-center rounded hover:bg-slate-700/60 text-slate-400 shrink-0';
              toggleCaret.innerHTML = getIcon(isCollapsed ? 'chevronRight' : 'chevronDown');
              toggleCaret.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.collapsedPaths.has(node.path)) {
                  state.collapsedPaths.delete(node.path);
                } else {
                  state.collapsedPaths.add(node.path);
                }
                renderDiffOutput();
              });
              leftPart.appendChild(toggleCaret);
            } else {
              const spacer = document.createElement('span');
              spacer.className = 'w-4 shrink-0 text-center font-mono text-[10px] opacity-60';
              spacer.textContent = node.isListItem ? '-' : '•';
              leftPart.appendChild(spacer);
            }

            const keySpan = document.createElement('span');
            keySpan.className = `font-mono font-semibold truncate ${
              node.status === 'removed' ? 'line-through opacity-80' : ''
            }`;
            keySpan.textContent = node.key;
            leftPart.appendChild(keySpan);

            // Vista previa compacta de la fórmula PowerFx si es nodo hoja
            if (!hasChildren && (node.newValue || node.oldValue)) {
              const previewVal = node.status === 'removed' ? node.oldValue : node.newValue;
              const singleLinePreview = previewVal.replace(/\s+/g, ' ').trim();
              const valPreview = document.createElement('span');
              valPreview.className = 'font-mono text-[11px] truncate opacity-85 ml-1';
              valPreview.innerHTML = `: ${highlightPowerFx(
                singleLinePreview.length > 48
                  ? `${singleLinePreview.slice(0, 48)}...`
                  : singleLinePreview
              )}`;
              leftPart.appendChild(valPreview);
            }

            const rightBadge = document.createElement('span');
            rightBadge.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${statusBadgeClass}`;
            rightBadge.textContent = statusSymbol;

            rowBtn.append(leftPart, rightBadge);

            rowBtn.addEventListener('click', () => {
              state.selectedNodePath = node.path;
              renderDiffOutput();
            });

            nodeWrap.appendChild(rowBtn);

            if (hasChildren && !isCollapsed) {
              const childrenContainer = document.createElement('div');
              childrenContainer.className = 'mt-0.5 space-y-0.5';
              node.children.forEach((child) => {
                childrenContainer.appendChild(renderTreeNode(child, depth + 1));
              });
              nodeWrap.appendChild(childrenContainer);
            }

            return nodeWrap;
          }

          visibleNodes.forEach((node) => {
            treeScroll.appendChild(renderTreeNode(node, 0));
          });
        }

        treeColumn.append(treeHeader, treeScroll);

        // Columna Derecha: Inspector de Diff PowerFx del Nodo Seleccionado + Resumen de Propiedades Modificadas (7 columnas en lg)
        const inspectorColumn = document.createElement('div');
        inspectorColumn.className =
          'lg:col-span-7 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-slate-950/70';

        const selectedNode = state.selectedNodePath
          ? findNodeByPath(fullDiffTree, state.selectedNodePath)
          : null;

        if (selectedNode) {
          const statusVariantMap = {
            added: { text: 'Nodo Agregado (+)', variant: 'success' },
            removed: { text: 'Nodo Eliminado (-)', variant: 'danger' },
            modified: { text: 'Nodo Modificado (~)', variant: 'warning' },
            unchanged: { text: 'Sin Cambios (=)', variant: 'default' }
          };
          const badgeMeta = statusVariantMap[selectedNode.status] || statusVariantMap.unchanged;

          const nodeHeaderCard = document.createElement('div');
          nodeHeaderCard.className =
            'p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2';
          nodeHeaderCard.innerHTML = `
            <div class="min-w-0">
              <div class="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ruta del Nodo YAML</div>
              <div class="text-xs font-mono font-bold text-indigo-300 break-all mt-0.5">${escapeHtml(
                selectedNode.path
              )}</div>
            </div>
          `;
          nodeHeaderCard.appendChild(
            createBadge({ text: badgeMeta.text, variant: badgeMeta.variant })
          );
          inspectorColumn.appendChild(nodeHeaderCard);

          // Si el nodo seleccionado tiene valor directo (propiedad o fórmula PowerFx), mostrar su diff
          if (selectedNode.oldValue || selectedNode.newValue) {
            const formulaSection = document.createElement('div');
            formulaSection.className = 'space-y-1.5';
            formulaSection.innerHTML = `
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Diff de Código PowerFx / Valor de Propiedad
                </span>
              </div>
            `;
            formulaSection.appendChild(
              buildPowerFxDiffElement(selectedNode.oldValue, selectedNode.newValue)
            );
            inspectorColumn.appendChild(formulaSection);
          }

          // Si es un nodo contenedor (ej. Screen, Control, Properties), listar todas las propiedades hijas con su diff PowerFx
          if (selectedNode.children?.length > 0) {
            const leafProps = [];
            function collectLeaves(list) {
              list.forEach((item) => {
                if (
                  (item.oldValue || item.newValue) &&
                  (state.treeFilter === 'all' || item.status !== 'unchanged')
                ) {
                  leafProps.push(item);
                }
                if (item.children?.length) {
                  collectLeaves(item.children);
                }
              });
            }
            collectLeaves(selectedNode.children);

            const childrenSection = document.createElement('div');
            childrenSection.className = 'space-y-2.5';
            childrenSection.innerHTML = `
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Propiedades y Fórmulas PowerFx dentro de "${escapeHtml(selectedNode.key)}" (${
              leafProps.length
            })
              </div>
            `;

            if (leafProps.length === 0) {
              const emptyLeaves = document.createElement('div');
              emptyLeaves.className =
                'p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs text-slate-400';
              emptyLeaves.textContent =
                'No hay propiedades con cambios dentro de este nodo.';
              childrenSection.appendChild(emptyLeaves);
            } else {
              leafProps.forEach((propNode) => {
                const propCard = document.createElement('div');
                propCard.className =
                  'rounded-xl border border-slate-800/90 bg-slate-900/60 overflow-hidden';

                const propHead = document.createElement('div');
                propHead.className =
                  'px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2';

                const propTitle = document.createElement('span');
                propTitle.className = 'font-mono text-xs font-semibold text-slate-200 truncate';
                propTitle.textContent = propNode.path;

                const statusVariant =
                  propNode.status === 'added'
                    ? 'success'
                    : propNode.status === 'removed'
                    ? 'danger'
                    : propNode.status === 'modified'
                    ? 'warning'
                    : 'default';

                propHead.append(
                  propTitle,
                  createBadge({ text: propNode.status.toUpperCase(), variant: statusVariant })
                );

                const propBody = document.createElement('div');
                propBody.className = 'p-2';
                propBody.appendChild(
                  buildPowerFxDiffElement(propNode.oldValue, propNode.newValue, {
                    compact: true
                  })
                );

                propCard.append(propHead, propBody);
                childrenSection.appendChild(propCard);
              });
            }

            inspectorColumn.appendChild(childrenSection);
          }
        } else {
          inspectorColumn.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 mb-2">
                ${getIcon('gitDiff')}
              </div>
              <p class="text-xs font-medium text-slate-300">Selecciona un nodo en el árbol YAML</p>
              <p class="text-[11px] text-slate-500 mt-1">
                Haz clic en cualquier control o propiedad para inspeccionar su diff PowerFx resaltado.
              </p>
            </div>
          `;
        }

        splitWorkspace.append(treeColumn, inspectorColumn);
        outputArea.appendChild(splitWorkspace);
      } else {
        // Modo PowerFx Directo
        viewOptionsContainer.append(layoutToggle, searchInput);

        const { stats } = computeLineDiff(state.textA, state.textB);
        renderStatsBadges(stats, 'líneas');

        const codeScroll = document.createElement('div');
        codeScroll.className = 'flex-1 overflow-y-auto custom-scrollbar p-4';
        codeScroll.appendChild(buildPowerFxDiffElement(state.textA, state.textB));
        outputArea.appendChild(codeScroll);
      }
    }

    updateModeButtonsUI();
    renderDiffOutput();

    root.append(topBar, inputsSection, filterBar, outputArea);
    container.appendChild(root);
  }
};
