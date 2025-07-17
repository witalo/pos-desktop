// src/components/PrintSettings.tsx
import { useState, useEffect } from 'react'
import { Printer, Settings, X, CheckCircle, AlertCircle } from 'lucide-react'
import { PrintService } from '../services/printService'

interface PrintSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrintSettings({ isOpen, onClose }: PrintSettingsProps) {
  const [printers, setPrinters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [defaultPrinter, setDefaultPrinter] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPrinters()
    }
  }, [isOpen])

  const loadPrinters = async () => {
    setLoading(true)
    try {
      const availablePrinters = await PrintService.getAvailablePrinters()
      setPrinters(availablePrinters)
      
      // Encontrar la impresora predeterminada
      const defaultP = availablePrinters.find(p => p.isDefault)
      if (defaultP) {
        setDefaultPrinter(defaultP.name)
      }
    } catch (error) {
      console.error('Error cargando impresoras:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl transform transition-all max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Configuración de Impresión</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Printer className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-3" />
                  <p className="text-gray-600">Buscando impresoras...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Estado actual */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-semibold text-blue-900">Impresión Automática Activada</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Las ventas se imprimirán automáticamente al guardarlas.
                        {defaultPrinter && (
                          <span className="block mt-1">
                            Impresora predeterminada: <strong>{defaultPrinter}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de impresoras */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Printer className="w-4 h-4 mr-2" />
                    Impresoras Disponibles ({printers.length})
                  </h4>
                  
                  {printers.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No se encontraron impresoras</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Asegúrese de tener al menos una impresora instalada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {printers.map((printer) => (
                        <div
                          key={printer.name}
                          className={`p-3 rounded-lg border transition-all ${
                            printer.isDefault 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Printer className={`w-4 h-4 ${
                                printer.isDefault ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <div>
                                <p className="font-medium text-gray-900">{printer.displayName}</p>
                                <p className="text-xs text-gray-500">{printer.name}</p>
                              </div>
                            </div>
                            {printer.isDefault && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-xs font-medium">Predeterminada</span>
                              </div>
                            )}
                          </div>
                          {printer.description && (
                            <p className="text-xs text-gray-500 mt-1 ml-7">{printer.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-700 mb-2">Información importante:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>Si no tiene impresora predeterminada, se mostrará el diálogo de impresión.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>El formato de impresión (A4 o Ticket) se configura en los ajustes de empresa.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>La impresión se realiza en segundo plano sin interrumpir su trabajo.</span>
                    </li>
                  </ul>
                </div>

                {/* Botón de actualizar */}
                <button
                  onClick={loadPrinters}
                  disabled={loading}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Actualizar Lista de Impresoras
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}