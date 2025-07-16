// src/components/PDFViewerModal.tsx
import { useState, useEffect, useRef } from 'react'
import { FileText, Printer, FileDown, Mail, X, Loader2, Settings, Monitor, Download } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'
import InvoicePDF from './InvoicePDF'

interface PDFViewerModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: string | null
}

// Query para obtener operación por ID
const GET_OPERATION_BY_ID_QUERY = `
  query GetOperationById($operationId: ID!) {
    operationById(operationId: $operationId) {
      id
      serial
      number
      operationDate
      emitDate
      emitTime
      operationType
      operationStatus
      currency
      globalDiscountPercent
      globalDiscount
      totalDiscount
      igvPercent
      igvAmount
      totalTaxable
      totalUnaffected
      totalExempt
      totalFree
      totalAmount
      person {
        id
        fullName
        document
        personType
        address
        email
        phone
      }
      user {
        id
        firstName
        lastName
        username
      }
      details {
        id
        description
        quantity
        unitValue
        unitPrice
        discountPercentage
        totalDiscount
        totalValue
        totalIgv
        totalAmount
        product {
          id
          code
          description
        }
      }
      paymentSet {
        id
        paymentType
        paymentMethod
        status
        paymentDate
        totalAmount
        paidAmount
        notes
      }
    }
  }
`

export default function PDFViewerModal({ isOpen, onClose, saleId }: PDFViewerModalProps) {
  const { company } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [sale, setSale] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && saleId) {
      loadSaleData()
    } else if (!isOpen) {
      // Limpiar datos cuando se cierra el modal
      setSale(null)
      setError(null)
    }
  }, [isOpen, saleId])

  // Limpiar estado de impresión cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setIsPrinting(false)
      setIsDownloading(false)
    }
  }, [isOpen])

  const loadSaleData = async () => {
    if (!saleId) return

    setLoading(true)
    setError(null)
    
    try {
      const { operationById } = await graphqlRequest(GET_OPERATION_BY_ID_QUERY, {
        operationId: saleId
      })

      if (operationById) {
        setSale(operationById)
      } else {
        setError('No se pudo cargar el comprobante')
      }
    } catch (error) {
      console.error('Error cargando comprobante:', error)
      setError('Error al cargar el comprobante. Verifique su conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    if (!sale || isPrinting) return

    setIsPrinting(true)
    
    try {
      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Configurar estilos de impresión específicos según el formato
      const printStyles = document.createElement('style')
      printStyles.textContent = `
        @media print {
          @page {
            ${company?.pdfSize === 'T' ? 'size: 80mm auto;' : 'size: A4;'}
            margin: ${company?.pdfSize === 'T' ? '2mm' : '12mm'};
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `
      
      document.head.appendChild(printStyles)
      
      // Imprimir
      window.print()
      
      // Limpiar estilos después de un tiempo
      setTimeout(() => {
        document.head.removeChild(printStyles)
        setIsPrinting(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error al imprimir:', error)
      setIsPrinting(false)
    }
  }

  const handleDownload = async () => {
    if (!sale || isDownloading) return

    setIsDownloading(true)
    
    try {
      // Simular descarga (en producción esto sería una llamada al backend)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Crear elemento de descarga temporal
      const fileName = `${sale.serial}-${sale.number.toString().padStart(8, '0')}.pdf`
      
      // En producción, aquí harías una llamada al backend para generar el PDF real
      // Por ahora, simulamos la descarga
      console.log(`Descargando: ${fileName}`)
      
      // Mostrar notificación de éxito (podrías usar una librería de notificaciones)
      alert(`Archivo ${fileName} descargado exitosamente`)
      
    } catch (error) {
      console.error('Error al descargar:', error)
      alert('Error al descargar el archivo PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleEmail = () => {
    if (!sale) return
    
    // En producción, esto abriría un modal para enviar por email
    const subject = `Comprobante ${sale.serial}-${sale.number}`
    const body = `Adjunto encontrará su comprobante de venta ${sale.serial}-${sale.number.toString().padStart(8, '0')}`
    
    // Abrir cliente de email por defecto (alternativa básica)
    const emailUrl = `mailto:${sale.person?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(emailUrl, '_blank')
  }

  // Determinar el título del modal según el formato
  const getModalTitle = () => {
    if (!sale) return 'Cargando...'
    
    const formatText = company?.pdfSize === 'T' ? '(Ticket 80mm)' : '(A4)'
    return `${sale.serial}-${sale.number} ${formatText}`
  }

  // Obtener el color del tema basado en la configuración de la empresa
  const getThemeColor = () => {
    return company?.pdfColor || '#1e293b'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        {/* Modal Container */}
        <div className={`relative bg-white rounded-xl shadow-2xl transform transition-all w-full ${
          company?.pdfSize === 'T' ? 'max-w-md' : 'max-w-5xl'
        }`}>
          
          {/* Header del Modal */}
          <div 
            className="text-white px-4 py-3 rounded-t-xl no-print flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${getThemeColor()}, ${getThemeColor()}dd)` }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-tight">
                  {getModalTitle()}
                </h3>
                <p className="text-xs text-white/80">
                  {company?.pdfSize === 'T' ? 'Formato para impresora térmica' : 'Formato estándar A4'}
                </p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center space-x-1">
              {/* Botón Imprimir */}
              <button
                onClick={handlePrint}
                disabled={loading || !sale || isPrinting}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                title="Imprimir comprobante"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Botón Descargar */}
              <button
                onClick={handleDownload}
                disabled={loading || !sale || isDownloading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                title="Descargar PDF"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Botón Email */}
              <button
                onClick={handleEmail}
                disabled={loading || !sale}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Enviar por email"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              {/* Separador */}
              <div className="w-px h-6 bg-white/20 mx-1"></div>

              {/* Botón Cerrar */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                title="Cerrar"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Contenedor del PDF */}
          <div 
            className={`bg-gradient-to-b from-gray-50 to-gray-100 overflow-auto no-print ${
              company?.pdfSize === 'T' ? 'p-3' : 'p-4'
            }`} 
            style={{ 
              maxHeight: company?.pdfSize === 'T' ? '85vh' : '80vh',
              minHeight: '400px'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Cargando comprobante...</p>
                  <p className="text-gray-500 text-sm mt-1">Esto puede tomar unos segundos</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar</h4>
                  <p className="text-red-600 mb-4 text-sm">{error}</p>
                  <button
                    onClick={loadSaleData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : sale ? (
              <div className="print-content">
                <InvoicePDF sale={sale} company={company} />
              </div>
            ) : null}
          </div>

          {/* Footer del Modal */}
          {sale && !loading && !error && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 rounded-b-xl no-print">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Monitor className="w-3 h-3" />
                    <span>Formato: {company?.pdfSize === 'T' ? 'Ticket 80mm' : 'A4'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Settings className="w-3 h-3" />
                    <span>Estado: {sale.operationStatus === '2' ? 'Emitido' : 'Registrado'}</span>
                  </div>
                </div>
                <div className="text-gray-500">
                  ID: {sale?.id ? String(sale.id).substring(0, 8) : 'N/A'}...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estilos globales para impresión */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-content {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}} />
    </div>
  )
}