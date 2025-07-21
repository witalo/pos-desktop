
import React, { useEffect, useRef } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  subMessage?: string
  autoCloseDelay?: number // milisegundos para cerrar automáticamente
}

export default function SuccessDialog({
  isOpen,
  onClose,
  title = 'Operación Exitosa',
  message,
  subMessage,
  autoCloseDelay = 3000
}: SuccessDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (!isOpen) return
    
    // Enfocar botón de cerrar
    setTimeout(() => closeButtonRef.current?.focus(), 100)
    
    // Auto cerrar si está configurado
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoCloseDelay])
  
  // Manejar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-t-xl relative">
          <div className="flex items-center justify-center">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 font-medium">{message}</p>
          {subMessage && (
            <p className="text-sm text-slate-500 mt-2">{subMessage}</p>
          )}
          
          {/* Barra de progreso para auto-cierre */}
          {autoCloseDelay > 0 && (
            <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-linear"
                style={{
                  animation: `shrinkWidth ${autoCloseDelay}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-4">
          <button
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClose()
              }
            }}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Aceptar
          </button>
        </div>
      </div>
      
      {/* Estilo inline para la animación */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shrinkWidth {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  )
}