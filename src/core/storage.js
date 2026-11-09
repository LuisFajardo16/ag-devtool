/**
 * Servicio centralizado de persistencia en localStorage
 */
export const STORAGE_KEYS = {
  INSTALLED_TOOLS: 'ag_devtool_installed_tools',
  LAYOUT: 'ag_devtool_layout',
  SIDEBAR: 'ag_devtool_sidebar',
  NOTES: 'ag_devtool_notes',
  ADMIN_SESSION: 'ag_devtool_admin_session',
  WORKSPACES: 'ag_devtool_workspaces',
  ACTIVE_WORKSPACE: 'ag_devtool_active_workspace',
  WORKSPACE_LAYOUTS: 'ag_devtool_workspace_layouts',
  COLOR_HISTORY: 'ag_devtool_color_history',
  MARKDOWN_MANAGER: 'ag_devtool_markdown_manager',
  BLOCK_NOTES_MANAGER: 'ag_devtool_block_notes'
};

export const StorageService = {
  get(key, defaultValue = null) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[StorageService] Error leyendo clave "${key}":`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[StorageService] Error guardando clave "${key}":`, err);
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageService] Error eliminando clave "${key}":`, err);
    }
  },

  getAllAppData() {
    const snapshot = {};
    Object.values(STORAGE_KEYS).forEach((k) => {
      snapshot[k] = this.get(k, null);
    });
    return snapshot;
  }
};
