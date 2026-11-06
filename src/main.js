import { PanelManager } from './components/layout/PanelManager.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Topbar } from './components/layout/Topbar.js';

function bootstrapApp() {
  const topbarRoot = document.getElementById('topbar-root');
  const sidebarRoot = document.getElementById('sidebar-root');
  const workspaceRoot = document.getElementById('workspace-root');

  const panelManager = new PanelManager(workspaceRoot);
  const sidebar = new Sidebar(sidebarRoot, panelManager);
  const topbar = new Topbar(topbarRoot, panelManager);

  panelManager.render();
  sidebar.render();
  topbar.render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
