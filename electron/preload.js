// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Almacenamiento de datos de empresa
  saveCompanyData: (companyData) => ipcRenderer.invoke('save-company-data', companyData),
  getCompanyData: () => ipcRenderer.invoke('get-company-data'),
  clearCompanyData: () => ipcRenderer.invoke('clear-company-data'),
  
  // Almacenamiento genérico
  storage: {
    get: (key) => ipcRenderer.invoke('storage-get', key),
    set: (key, value) => ipcRenderer.invoke('storage-set', key, value),
    delete: (key) => ipcRenderer.invoke('storage-delete', key)
  },

  // Navegación desde el menú
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  // Eventos del menú
  onMenuAction: (action, callback) => {
    ipcRenderer.on(`menu-${action}`, callback);
  },

  // Mostrar atajos
  onShowShortcuts: (callback) => {
    ipcRenderer.on('show-shortcuts', callback);
  },

  // Información del sistema
  platform: process.platform,
  version: process.versions.electron
});