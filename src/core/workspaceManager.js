import { StorageService, STORAGE_KEYS } from './storage.js';
import { events } from './events.js';

const DEFAULT_MARKET_TOOLS = ['block-notes-manager', 'notes-manager', 'json-formatter'];

export const SYSTEM_WORKSPACES = [
  {
    id: 'default',
    name: 'default',
    isSystem: true,
    wsTools: []
  },
  {
    id: 'navas-jmd',
    name: 'Navas JMD',
    isSystem: true,
    wsTools: ['canvas-app-suffix-generator', 'yaml-powerfx-diff']
  }
];

function loadNormalizedWorkspaces() {
  const saved = StorageService.get(STORAGE_KEYS.WORKSPACES, null);
  const legacyInstalled = StorageService.get(STORAGE_KEYS.INSTALLED_TOOLS, null);
  const defaultInitialMarket =
    Array.isArray(legacyInstalled) && legacyInstalled.length > 0
      ? legacyInstalled
      : [...DEFAULT_MARKET_TOOLS];

  const savedMap = new Map();
  if (Array.isArray(saved)) {
    saved.forEach((ws) => {
      if (ws && typeof ws.id === 'string') {
        savedMap.set(ws.id, ws);
      }
    });
  }

  // Garantizar que los workspaces de sistema siempre existan y conserven sus propiedades de sistema
  const result = SYSTEM_WORKSPACES.map((sysWs) => {
    const existing = savedMap.get(sysWs.id);
    const fallbackMarket =
      sysWs.id === 'default' ? defaultInitialMarket : [...DEFAULT_MARKET_TOOLS];
    const resolvedTools = Array.isArray(existing?.installedMarketTools)
      ? [...existing.installedMarketTools]
      : [...fallbackMarket];
    if (!resolvedTools.includes('block-notes-manager')) {
      resolvedTools.unshift('block-notes-manager');
    }
    return {
      id: sysWs.id,
      name: sysWs.name,
      isSystem: true,
      wsTools: [...sysWs.wsTools],
      installedMarketTools: resolvedTools
    };
  });

  // Agregar workspaces personalizados creados por el usuario
  if (Array.isArray(saved)) {
    saved.forEach((ws) => {
      if (
        ws &&
        typeof ws.id === 'string' &&
        !SYSTEM_WORKSPACES.some((sys) => sys.id === ws.id)
      ) {
        result.push({
          id: ws.id,
          name: String(ws.name || 'Workspace').trim(),
          isSystem: false,
          wsTools: [],
          installedMarketTools: Array.isArray(ws.installedMarketTools)
            ? ws.installedMarketTools
            : [...DEFAULT_MARKET_TOOLS]
        });
      }
    });
  }

  if (!Array.isArray(saved)) {
    StorageService.set(STORAGE_KEYS.WORKSPACES, result);
  }

  return result;
}

export const WorkspaceManager = {
  getWorkspaces() {
    return loadNormalizedWorkspaces();
  },

  getWorkspaceById(id) {
    return this.getWorkspaces().find((ws) => ws.id === id) || null;
  },

  getActiveWorkspaceId() {
    const savedId = StorageService.get(STORAGE_KEYS.ACTIVE_WORKSPACE, 'default');
    const all = this.getWorkspaces();
    if (all.some((ws) => ws.id === savedId)) {
      return savedId;
    }
    StorageService.set(STORAGE_KEYS.ACTIVE_WORKSPACE, 'default');
    return 'default';
  },

  getActiveWorkspace() {
    const activeId = this.getActiveWorkspaceId();
    return this.getWorkspaceById(activeId) || this.getWorkspaces()[0];
  },

  setActiveWorkspace(id) {
    const target = this.getWorkspaceById(id);
    if (!target) return false;

    const currentId = this.getActiveWorkspaceId();
    StorageService.set(STORAGE_KEYS.ACTIVE_WORKSPACE, target.id);
    StorageService.set(STORAGE_KEYS.INSTALLED_TOOLS, target.installedMarketTools);

    if (currentId !== target.id) {
      events.emit('workspace:changed', { workspace: target, previousId: currentId });
      events.emit('tools:changed', {
        installedIds: target.installedMarketTools,
        action: 'workspace-switch',
        workspaceId: target.id
      });
    }
    return true;
  },

  createWorkspace(rawName, { switchImmediately = true } = {}) {
    const cleanName = String(rawName || '').trim();
    if (!cleanName) {
      return { ok: false, error: 'El nombre del workspace no puede estar vacío.' };
    }

    const all = this.getWorkspaces();
    if (all.some((ws) => ws.name.toLowerCase() === cleanName.toLowerCase())) {
      return { ok: false, error: `Ya existe un workspace llamado "${cleanName}".` };
    }

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSuffix = Date.now().toString(36).slice(-4);
    const id = `ws-${slug || 'custom'}-${uniqueSuffix}`;

    const newWorkspace = {
      id,
      name: cleanName,
      isSystem: false,
      wsTools: [],
      installedMarketTools: [...DEFAULT_MARKET_TOOLS]
    };

    const updated = [...all, newWorkspace];
    StorageService.set(STORAGE_KEYS.WORKSPACES, updated);

    if (switchImmediately) {
      this.setActiveWorkspace(newWorkspace.id);
    } else {
      events.emit('workspace:changed', { workspace: this.getActiveWorkspace() });
    }

    return { ok: true, workspace: newWorkspace };
  },

  deleteWorkspace(id) {
    const target = this.getWorkspaceById(id);
    if (!target) {
      return { ok: false, error: 'El workspace especificado no existe.' };
    }
    if (target.isSystem) {
      return {
        ok: false,
        error: 'No se pueden eliminar los workspaces definidos por el sistema.'
      };
    }

    const updated = this.getWorkspaces().filter((ws) => ws.id !== id);
    StorageService.set(STORAGE_KEYS.WORKSPACES, updated);

    // Limpiar layout guardado de este workspace
    const layouts = StorageService.get(STORAGE_KEYS.WORKSPACE_LAYOUTS, {});
    if (layouts && typeof layouts === 'object' && id in layouts) {
      delete layouts[id];
      StorageService.set(STORAGE_KEYS.WORKSPACE_LAYOUTS, layouts);
    }

    if (this.getActiveWorkspaceId() === id) {
      this.setActiveWorkspace('default');
    } else {
      events.emit('workspace:changed', { workspace: this.getActiveWorkspace() });
    }

    return { ok: true };
  },

  getInstalledMarketToolIds(workspaceId = null) {
    const ws = workspaceId
      ? this.getWorkspaceById(workspaceId)
      : this.getActiveWorkspace();
    return ws ? [...ws.installedMarketTools] : [...DEFAULT_MARKET_TOOLS];
  },

  setInstalledMarketToolIds(toolIds, workspaceId = null) {
    const targetId = workspaceId || this.getActiveWorkspaceId();
    const all = this.getWorkspaces().map((ws) => {
      if (ws.id === targetId) {
        return {
          ...ws,
          installedMarketTools: [...toolIds]
        };
      }
      return ws;
    });
    StorageService.set(STORAGE_KEYS.WORKSPACES, all);
    if (targetId === this.getActiveWorkspaceId()) {
      StorageService.set(STORAGE_KEYS.INSTALLED_TOOLS, [...toolIds]);
    }
  }
};
