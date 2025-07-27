// electron/main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
// const isDev = process.env.NODE_ENV !== 'production';
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
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
  // if (isDev) {
  //   mainWindow.loadURL('http://localhost:3000');
  //   mainWindow.webContents.openDevTools();
  // } else {
  //   // En producción, cargar el archivo compilado
  //   mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  // }
  // En desarrollo, cargar desde el servidor de Vite
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar el archivo compilado
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    
    // Desactivar DevTools con F12 en producción
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        event.preventDefault();
      }
    });
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
// function createMenu() {
//   const template = [
//     {
//       // label: 'Archivo',
//       label: 'Ver',
//       submenu: [
//         {
//           label: 'Nueva Venta',
//           accelerator: 'CmdOrCtrl+N',
//           click: () => {
//             mainWindow.webContents.send('menu-new-sale');
//           }
//         },
//         { type: 'separator' },
//         {
//           label: 'Salir',
//           accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
//           click: () => {
//             app.quit();
//           }
//         }
//       ]
//     },
//     {
//       label: 'Editar',
//       submenu: [
//         { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
//         { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
//         { type: 'separator' },
//         { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
//         { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
//         { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' }
//       ]
//     },
//     {
//       label: 'Ver',
//       submenu: [
//         { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
//         { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
//         { label: 'Herramientas de Desarrollo', accelerator: 'F12', role: 'toggleDevTools' },
//         { type: 'separator' },
//         { label: 'Pantalla Completa', accelerator: 'F11', role: 'togglefullscreen' }
//       ]
//     },
//     {
//       label: 'Navegación',
//       submenu: [
//         {
//           label: 'Dashboard',
//           accelerator: 'Alt+D',
//           click: () => {
//             mainWindow.webContents.send('navigate', '/');
//           }
//         },
//         {
//           label: 'Punto de Venta',
//           accelerator: 'F1',
//           click: () => {
//             mainWindow.webContents.send('navigate', '/pos');
//           }
//         },
//         {
//           label: 'Inventario',
//           accelerator: 'Alt+I',
//           click: () => {
//             mainWindow.webContents.send('navigate', '/inventory');
//           }
//         },
//         {
//           label: 'Clientes',
//           accelerator: 'Alt+C',
//           click: () => {
//             mainWindow.webContents.send('navigate', '/customers');
//           }
//         }
//       ]
//     },
//     {
//       label: 'Ayuda',
//       submenu: [
//         {
//           label: 'Atajos de Teclado',
//           accelerator: 'CmdOrCtrl+?',
//           click: () => {
//             mainWindow.webContents.send('show-shortcuts');
//           }
//         },
//         {
//           label: 'Acerca de',
//           click: () => {
//             mainWindow.webContents.send('show-about');
//           }
//         }
//       ]
//     }
//   ];

//   const menu = Menu.buildFromTemplate(template);
//   Menu.setApplicationMenu(menu);
// }
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Venta',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('navigate', '/pos');
          }
        },
        {
          label: 'Nueva Compra',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('navigate', '/purchase');
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
        ...(isDev ? [{ label: 'Herramientas de Desarrollo', accelerator: 'F12', role: 'toggleDevTools' }] : []),
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
          label: 'Ventas',
          accelerator: 'Alt+V',
          click: () => {
            mainWindow.webContents.send('navigate', '/sales');
          }
        },
        {
          label: 'Compras',
          accelerator: 'Alt+C',
          click: () => {
            mainWindow.webContents.send('navigate', '/purchases');
          }
        },
        {
          label: 'Productos',
          accelerator: 'Alt+P',
          click: () => {
            mainWindow.webContents.send('navigate', '/products');
          }
        },
        {
          label: 'Pagos',
          accelerator: 'Alt+G',
          click: () => {
            mainWindow.webContents.send('navigate', '/payments');
          }
        },
        {
          label: 'Reportes',
          accelerator: 'Alt+R',
          click: () => {
            mainWindow.webContents.send('navigate', '/reports');
          }
        },
        {
          label: 'Clientes',
          accelerator: 'Alt+L',
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

// IMPRESION
// Agregar estos handlers al final de tu main.js, después de los otros ipcMain.handle

// Handler para impresión silenciosa
ipcMain.handle('silent-print', async (event, htmlContent, options = {}) => {
  try {
    // Crear una ventana oculta para imprimir
    const printWindow = new BrowserWindow({
      show: false,
      width: options.format === 'T' ? 300 : 800,
      height: options.format === 'T' ? 600 : 1100,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Cargar el contenido HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Esperar un poco para que se renderice
    await new Promise(resolve => setTimeout(resolve, 500));

    // Configuración de impresión según el formato
    const printOptions = {
      silent: true, // Impresión silenciosa
      printBackground: true,
      color: true,
      margins: {
        marginType: options.format === 'T' ? 'none' : 'default'
      },
      pageSize: options.format === 'T' ? {
        width: 80000, // 80mm en micrones
        height: 297000 // altura variable para ticket
      } : 'A4',
      scaleFactor: options.format === 'T' ? 100 : 100,
      landscape: false
    };

    // Intentar imprimir
    return new Promise((resolve, reject) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        printWindow.close();
        
        if (success) {
          resolve({ success: true });
        } else {
          // Si falla la impresión silenciosa, mostrar diálogo
          if (failureReason === 'cancelled') {
            resolve({ success: false, showDialog: true });
          } else {
            reject(new Error(failureReason));
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Error en impresión silenciosa:', error);
    return { success: false, error: error.message, showDialog: true };
  }
});

// Handler para impresión con diálogo (fallback)
ipcMain.handle('print-with-dialog', async (event, htmlContent, options = {}) => {
  try {
    const printWindow = new BrowserWindow({
      show: false,
      width: options.format === 'T' ? 300 : 800,
      height: options.format === 'T' ? 600 : 1100,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    const printOptions = {
      silent: false, // Mostrar diálogo
      printBackground: true,
      color: true,
      margins: {
        marginType: options.format === 'T' ? 'none' : 'default'
      },
      pageSize: options.format === 'T' ? 'custom' : 'A4',
      landscape: false
    };

    return new Promise((resolve, reject) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        printWindow.close();
        
        if (success) {
          resolve({ success: true });
        } else {
          reject(new Error(failureReason || 'Impresión cancelada'));
        }
      });
    });
    
  } catch (error) {
    console.error('Error en impresión con diálogo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para obtener impresoras disponibles
ipcMain.handle('get-printers', async () => {
  try {
    const window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (window) {
      const printers = await window.webContents.getPrintersAsync();
      return printers;
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo impresoras:', error);
    return [];
  }
});