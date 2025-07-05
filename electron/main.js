// electron/main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let splashWindow;

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reloader')(module);
  } catch {}
}

// Función para crear ventana splash
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// Función para crear ventana principal
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // En desarrollo, cargar desde el servidor de Vite
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar el archivo compilado
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      mainWindow.show();
    }, 1500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Configurar menú de la aplicación
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Venta',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-sale');
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Herramientas de Desarrollo', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Pantalla Completa', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navegación',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'Alt+D',
          click: () => {
            mainWindow.webContents.send('navigate', '/');
          }
        },
        {
          label: 'Punto de Venta',
          accelerator: 'F1',
          click: () => {
            mainWindow.webContents.send('navigate', '/pos');
          }
        },
        {
          label: 'Inventario',
          accelerator: 'Alt+I',
          click: () => {
            mainWindow.webContents.send('navigate', '/inventory');
          }
        },
        {
          label: 'Clientes',
          accelerator: 'Alt+C',
          click: () => {
            mainWindow.webContents.send('navigate', '/customers');
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Atajos de Teclado',
          accelerator: 'CmdOrCtrl+?',
          click: () => {
            mainWindow.webContents.send('show-shortcuts');
          }
        },
        {
          label: 'Acerca de',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers para almacenamiento de datos de empresa
const Store = require('electron-store');
const store = new Store();

// Guardar datos de empresa
ipcMain.handle('save-company-data', async (event, companyData) => {
  try {
    store.set('company', companyData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Obtener datos de empresa
ipcMain.handle('get-company-data', async () => {
  try {
    const companyData = store.get('company');
    return companyData || null;
  } catch (error) {
    return null;
  }
});

// Limpiar datos de empresa
ipcMain.handle('clear-company-data', async () => {
  try {
    store.delete('company');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handlers para almacenamiento genérico
ipcMain.handle('storage-get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('storage-set', async (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('storage-delete', async (event, key) => {
  store.delete(key);
  return true;
});