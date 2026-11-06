import { StorageService, STORAGE_KEYS } from './storage.js';
import { events } from './events.js';
import { AuthService } from './auth.js';
import { NotesManagerTool } from '../tools/NotesManager.js';
import {
  JsonFormatterTool,
  Base64CodecTool,
  UuidHashTool,
  RegexTesterTool
} from '../tools/BuiltinTools.js';
import { AdminComponentsTool } from '../views/AdminComponentsView.js';

const ALL_TOOLS = [
  NotesManagerTool,
  JsonFormatterTool,
  Base64CodecTool,
  UuidHashTool,
  RegexTesterTool,
  AdminComponentsTool
];

function getInitialInstalledIds() {
  const saved = StorageService.get(STORAGE_KEYS.INSTALLED_TOOLS, null);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  const defaults = ALL_TOOLS.filter((t) => t.defaultInstalled && !t.adminOnly).map((t) => t.id);
  StorageService.set(STORAGE_KEYS.INSTALLED_TOOLS, defaults);
  return defaults;
}

export const ToolRegistry = {
  getAllMarketplaceTools() {
    return ALL_TOOLS.filter((t) => !t.adminOnly);
  },

  getToolById(id) {
    const tool = ALL_TOOLS.find((t) => t.id === id);
    if (!tool) return null;
    if (tool.adminOnly && !AuthService.isAdmin()) return null;
    return tool;
  },

  getInstalledToolIds() {
    return getInitialInstalledIds();
  },

  getInstalledTools() {
    const installedIds = this.getInstalledToolIds();
    const list = ALL_TOOLS.filter((t) => !t.adminOnly && installedIds.includes(t.id));
    if (AuthService.isAdmin()) {
      list.push(AdminComponentsTool);
    }
    return list;
  },

  isInstalled(id) {
    if (id === 'admin-ui-kit') return AuthService.isAdmin();
    return this.getInstalledToolIds().includes(id);
  },

  installTool(id) {
    const current = this.getInstalledToolIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      StorageService.set(STORAGE_KEYS.INSTALLED_TOOLS, updated);
      events.emit('tools:changed', { installedIds: updated, action: 'install', toolId: id });
    }
  },

  uninstallTool(id) {
    const current = this.getInstalledToolIds();
    const updated = current.filter((item) => item !== id);
    StorageService.set(STORAGE_KEYS.INSTALLED_TOOLS, updated);
    events.emit('tools:changed', { installedIds: updated, action: 'uninstall', toolId: id });
  }
};
