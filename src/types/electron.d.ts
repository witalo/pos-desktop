// src/types/electron.d.ts
interface PrintOptions {
  format: 'A' | 'T'
  color?: string
}

interface PrintResult {
  success: boolean
  error?: string
  showDialog?: boolean
}

interface Printer {
  name: string
  displayName: string
  description: string
  status: number
  isDefault: boolean
  options: any
}

export interface ElectronAPI {
  // Almacenamiento de empresa
  saveCompanyData: (companyData: any) => Promise<{ success: boolean; error?: string }>;
  getCompanyData: () => Promise<any | null>;
  clearCompanyData: () => Promise<{ success: boolean; error?: string }>;
  
  // Almacenamiento genérico
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
  
  // Métodos antiguos (para compatibilidad)
  getStorageItem?: (key: string) => Promise<any>;
  setStorageItem?: (key: string, value: any) => Promise<void>;
  removeStorageItem?: (key: string) => Promise<void>;
  
  // Navegación
  onNavigate: (callback: (path: string) => void) => void;
  
  // Eventos del menú
  onMenuAction: (action: string, callback: () => void) => void;
  
  // Mostrar atajos
  onShowShortcuts: (callback: () => void) => void;
  
  // Sistema
  platform: string;
  version: string;
  
  // Nuevas APIs de impresión
  print: {
    silentPrint: (htmlContent: string, options: PrintOptions) => Promise<PrintResult>
    printWithDialog: (htmlContent: string, options: PrintOptions) => Promise<PrintResult>
    getPrinters: () => Promise<Printer[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
export {}