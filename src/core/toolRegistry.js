import { events } from './events.js';
import { AuthService } from './auth.js';
import { WorkspaceManager } from './workspaceManager.js';
import { NotesManagerTool } from '../tools/NotesManager.js';
import { MarkdownManagerTool } from '../tools/MarkdownManager.js';
import {
  JsonFormatterTool,
  Base64CodecTool,
  UuidHashTool,
  RegexTesterTool,
  ColorPickerTool
} from '../tools/BuiltinTools.js';
import { CanvasSuffixGeneratorTool } from '../tools/CanvasSuffixGenerator.js';
import { YamlPowerFxDiffTool } from '../tools/YamlPowerFxDiff.js';
import { AdminComponentsTool } from '../views/AdminComponentsView.js';

const MARKET_TOOLS = [
  NotesManagerTool,
  MarkdownManagerTool,
  JsonFormatterTool,
  ColorPickerTool,
  Base64CodecTool,
  UuidHashTool,
  RegexTesterTool
];

const WS_TOOLS = [
  CanvasSuffixGeneratorTool,
  YamlPowerFxDiffTool
];

const ALL_TOOLS = [
  ...WS_TOOLS,
  ...MARKET_TOOLS,
  AdminComponentsTool
];

export const ToolRegistry = {
  /**
   * Devuelve únicamente las herramientas públicas del Marketplace (excluye WS Tools y Admin)
   */
  getAllMarketplaceTools() {
    return MARKET_TOOLS.filter((t) => !t.adminOnly && !t.isWsTool);
  },

  /**
   * Devuelve las WS Tools preinstaladas del workspace activo
   */
  getActiveWorkspaceTools() {
    const activeWs = WorkspaceManager.getActiveWorkspace();
    const wsToolIds = activeWs?.wsTools || [];
    return WS_TOOLS.filter((t) => wsToolIds.includes(t.id));
  },

  getToolById(id) {
    const tool = ALL_TOOLS.find((t) => t.id === id);
    if (!tool) return null;
    if (tool.adminOnly && !AuthService.isAdmin()) return null;
    if (tool.isWsTool) {
      const activeWs = WorkspaceManager.getActiveWorkspace();
      if (!activeWs?.wsTools?.includes(tool.id)) return null;
    }
    return tool;
  },

  getInstalledToolIds() {
    return WorkspaceManager.getInstalledMarketToolIds();
  },

  getInstalledTools() {
    const wsTools = this.getActiveWorkspaceTools();
    const installedMarketIds = this.getInstalledToolIds();
    const marketList = MARKET_TOOLS.filter(
      (t) => !t.adminOnly && installedMarketIds.includes(t.id)
    );
    const list = [...wsTools, ...marketList];
    if (AuthService.isAdmin()) {
      list.push(AdminComponentsTool);
    }
    return list;
  },

  isInstalled(id) {
    if (id === 'admin-ui-kit') return AuthService.isAdmin();
    const activeWs = WorkspaceManager.getActiveWorkspace();
    if (activeWs?.wsTools?.includes(id)) return true;
    return this.getInstalledToolIds().includes(id);
  },

  installTool(id) {
    const current = this.getInstalledToolIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      WorkspaceManager.setInstalledMarketToolIds(updated);
      events.emit('tools:changed', {
        installedIds: updated,
        action: 'install',
        toolId: id
      });
    }
  },

  uninstallTool(id) {
    const activeWs = WorkspaceManager.getActiveWorkspace();
    if (activeWs?.wsTools?.includes(id)) {
      return; // Las WS Tools preinstaladas del workspace no se desinstalan
    }
    const current = this.getInstalledToolIds();
    const updated = current.filter((item) => item !== id);
    WorkspaceManager.setInstalledMarketToolIds(updated);
    events.emit('tools:changed', {
      installedIds: updated,
      action: 'uninstall',
      toolId: id
    });
  }
};
