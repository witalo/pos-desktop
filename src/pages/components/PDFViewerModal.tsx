// src/components/PDFViewerModal.tsx
import { useState, useEffect } from 'react'
import { FileText, Printer, FileDown, Mail, X, Loader2 } from 'lucide-react'
// import { graphqlRequest } from '../services/graphql'
// import { useAuthStore } from '../store/authStore'
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

  useEffect(() => {
    if (isOpen && saleId) {
      loadSaleData()
    }
  }, [isOpen, saleId])

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
      setError('Error al cargar el comprobante')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // En producción, aquí se llamaría a un endpoint para generar el PDF
    console.log('Descargar PDF')
  }

  const handleEmail = () => {
    // En producción, aquí se abriría un modal para enviar por email
    console.log('Enviar por email')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-4xl w-full">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 rounded-t-lg no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-semibold">
                  {sale ? `${sale.serial}-${sale.number}` : 'Cargando...'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  disabled={loading || !sale}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={loading || !sale}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Descargar"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={handleEmail}
                  disabled={loading || !sale}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Enviar por email"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenedor del PDF */}
          <div className="bg-gray-100 p-4 overflow-auto no-print" style={{ maxHeight: '80vh' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Cargando comprobante...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-2">{error}</p>
                  <button
                    onClick={loadSaleData}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : sale ? (
              <InvoicePDF sale={sale} company={company} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}