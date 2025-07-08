import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Calendar,
  Plus,
  Download,
  Eye,
  FileText,
  Users,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CalendarDays,
  TrendingUp,
  Package,
  Clock,
  ChevronDown,
  X,
  Printer,
  Mail,
  FileDown,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// TIPOS E INTERFACES
// =============================================
interface Sale {
  id: string
  serial: string
  number: number
  operationDate: string
  emitDate: string
  emitTime: string
  person?: {
    id: string
    fullName: string
    document: string
    personType: string
  } | null
  totalAmount: number
  totalTaxable: number
  igvAmount: number
  operationStatus: string
  currency: string
  details: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalAmount: number
  }>
}

interface SalesStats {
  totalSales: number
  totalAmount: number
  totalItems: number
  avgTicket: number
}

// =============================================
// QUERIES GRAPHQL
// =============================================
const GET_OPERATIONS_BY_DATE_QUERY = `
  query GetOperationsByDate($companyId: ID!, $date: String!, $operationType: String!) {
    operationsByDate(companyId: $companyId, date: $date, operationType: $operationType) {
      id
      serial
      number
      operationDate
      emitDate
      emitTime
      totalAmount
      totalTaxable
      igvAmount
      operationStatus
      currency
      person {
        id
        fullName
        document
        personType
      }
      details {
        id
        description
        quantity
        unitPrice
        totalAmount
      }
    }
  }
`

// Definir tipos explícitos para los estados
type OperationStatus = '1' | '2' | '3' | '4' | '5' | '6' | 'A_1' | 'A_2' | 'A_3' | 'A_4' | 'A_5' | 'A_6'

// Mapeo de estados del backend a estados internos
const STATUS_MAPPING: Record<string, string> = {
  'A_1': '1',
  'A_2': '2',
  'A_3': '3',
  'A_4': '4',
  'A_5': '5',
  'A_6': '6',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6'
}

const STATUS_LABELS: Record<string, string> = {
  '1': 'Registrado',
  '2': 'Emitido', 
  '3': 'Pendiente',
  '4': 'Proceso',
  '5': 'Anulado',
  '6': 'Rechazado'
}

const STATUS_COLORS: Record<string, string> = {
  '1': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm',
  '2': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm',
  '3': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm',
  '4': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm',
  '5': 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm',
  '6': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
}

// =============================================
// COMPONENTE MODAL PDF
// =============================================
const PDFViewerModal = ({ isOpen, onClose, sale }: { isOpen: boolean, onClose: () => void, sale: Sale | null }) => {
  if (!isOpen || !sale) return null

  // URL simulada del PDF - en producción vendría del backend
  const pdfUrl = `/api/sales/${sale.id}/pdf`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-4xl w-full">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Factura {sale.serial}-{sale.number}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {/* Descargar PDF */}}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {/* Enviar por email */}}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
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
          
          <div className="bg-gray-100 p-4" style={{ height: '600px' }}>
            {/* Aquí iría el iframe del PDF o un visor de PDF */}
            <div className="w-full h-full bg-white rounded-lg shadow-inner flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Vista previa del PDF</p>
                <p className="text-sm text-gray-500">
                  En producción aquí se mostraría el PDF de la factura
                </p>
                {/* En producción:
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-full rounded-lg"
                  title="PDF Viewer"
                />
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function SalesListPage() {
  const navigate = useNavigate()
  const { company } = useAuthStore()
  
  // Estados
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    // Obtener la fecha actual correctamente
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalAmount: 0,
    totalItems: 0,
    avgTicket: 0
  })

  // Referencias
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadSales()
  }, [selectedDate, company?.id])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/pos')
      } else if (e.key === 'F5') {
        e.preventDefault()
        loadSales()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const formatTime = (time: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`
  }

  // Función para obtener el estado con tipo seguro
  const getStatusLabel = (status: string): string => {
    const mappedStatus = STATUS_MAPPING[status] || status
    return STATUS_LABELS[mappedStatus] || 'Desconocido'
  }

  const getStatusColor = (status: string): string => {
    const mappedStatus = STATUS_MAPPING[status] || status
    return STATUS_COLORS[mappedStatus] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
  }

  // Función para obtener nombre del cliente de forma segura
  const getCustomerInfo = (person: Sale['person']) => {
    if (!person) {
      return {
        name: 'Cliente general',
        document: '00000000',
        type: 'DNI'
      }
    }
    
    return {
      name: person.fullName || 'Sin nombre',
      document: person.document || 'Sin documento',
      type: person.personType === '6' ? 'RUC' : 'DNI'
    }
  }

  // Función para obtener la fecha de hoy correctamente
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // =============================================
  // FUNCIONES DE NEGOCIO
  // =============================================
  const loadSales = async () => {
    if (!company?.id) return

    setLoading(true)
    try {
      const { operationsByDate } = await graphqlRequest(GET_OPERATIONS_BY_DATE_QUERY, {
        companyId: company.id,
        date: selectedDate,
        operationType: 'S'
      })

      setSales(operationsByDate || [])
      calculateStats(operationsByDate || [])
      setCurrentPage(1)
    } catch (error) {
      console.error('Error cargando ventas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (salesData: Sale[]) => {
    const totalSales = salesData.length
    const totalAmount = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalItems = salesData.reduce((sum, sale) => 
      sum + sale.details.reduce((detailSum, detail) => detailSum + detail.quantity, 0), 0
    )
    const avgTicket = totalSales > 0 ? totalAmount / totalSales : 0

    setStats({
      totalSales,
      totalAmount,
      totalItems,
      avgTicket
    })
  }

  // Filtrar ventas por búsqueda con validación segura y búsqueda mejorada
  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase().trim()
    
    // Si no hay término de búsqueda, mostrar todas
    if (!searchLower) return true
    
    // Buscar en documento (serial-número)
    const documentNumber = `${sale.serial}-${sale.number}`.toLowerCase()
    if (documentNumber.includes(searchLower)) return true
    
    // Buscar solo en número
    if (sale.number.toString().includes(searchTerm)) return true
    
    // Buscar en nombre del cliente
    if (sale.person?.fullName && sale.person.fullName.toLowerCase().includes(searchLower)) return true
    
    // Buscar en documento del cliente
    if (sale.person?.document && sale.person.document.toLowerCase().includes(searchLower)) return true
    
    // Buscar en monto total (permitir búsquedas como "100", "100.50", etc)
    const totalAmountStr = sale.totalAmount.toFixed(2)
    if (totalAmountStr.includes(searchTerm)) return true
    
    // Buscar en fecha
    const dateStr = new Date(sale.emitDate).toLocaleDateString('es-PE')
    if (dateStr.includes(searchTerm)) return true
    
    // Buscar en hora
    if (sale.emitTime && formatTime(sale.emitTime).includes(searchTerm)) return true
    
    // Buscar en estado
    const statusLabel = getStatusLabel(sale.operationStatus).toLowerCase()
    if (statusLabel.includes(searchLower)) return true
    
    // Buscar en items/productos de la venta
    const hasMatchingItem = sale.details.some(detail => 
      detail.description.toLowerCase().includes(searchLower)
    )
    if (hasMatchingItem) return true
    
    return false
  })

  // Paginación
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSales = filteredSales.slice(startIndex, endIndex)

  // Función para abrir el PDF
  const handleViewPDF = (sale: Sale) => {
    setSelectedSale(sale)
    setShowPDFModal(true)
    setShowDropdown(null)
  }

  // Generar páginas para mostrar
  const generatePageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7
    const halfRange = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfRange)
    let endPage = Math.min(totalPages, currentPage + halfRange)

    if (currentPage <= halfRange) {
      endPage = Math.min(totalPages, maxPagesToShow)
    }

    if (currentPage + halfRange >= totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }
  // =============================================
  // RENDERIZADO
  // =============================================
  return (
    <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
      {/* Header Ultra Compacto */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Lista de Ventas</h1>
              <p className="text-xs text-slate-300 leading-tight">
                Gestiona tus ventas realizadas
              </p>
            </div>
          </div>
          
          {/* Botón Nueva Venta Ultra Compacto */}
          <button
            onClick={() => navigate('/pos')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva Venta</span>
            <kbd className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs font-mono hidden lg:inline">Ctrl+N</kbd>
          </button>
        </div>
      </div>

      {/* Estadísticas Ultra Compactas */}
      <div className="px-4 py-2.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Total Ventas</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight">{stats.totalSales}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Importe Total</p>
                <p className="text-lg font-bold text-emerald-600 tracking-tight">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Items Vendidos</p>
                <p className="text-lg font-bold text-purple-600 tracking-tight">{stats.totalItems}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <Package className="w-3.5 h-3.5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Ticket Promedio</p>
                <p className="text-lg font-bold text-orange-600 tracking-tight">{formatCurrency(stats.avgTicket)}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles Ultra Compactos */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Selector de Fecha */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-xs font-medium text-slate-700">Fecha:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <button
                onClick={() => setSelectedDate(getTodayDate())}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium"
              >
                Hoy
              </button>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por documento, cliente, monto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Resetear a página 1 cuando se busca
                  }}
                  className="pl-7 pr-3 py-1.5 w-48 lg:w-64 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={loadSales}
                disabled={loading}
                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center space-x-1 text-xs font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Ultra Refinada - Responsive con Header Fijo */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 h-full flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Cargando ventas...</p>
              </div>
            </div>
          ) : currentSales.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-500 mb-1">No hay ventas registradas</p>
                <p className="text-slate-400 text-xs mb-3">
                  {searchTerm ? 'No se encontraron ventas con ese criterio' : 'Registra tu primera venta del día'}
                </p>
                <button
                  onClick={() => navigate('/pos')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-1.5 mx-auto text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primera Venta</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Contenedor de tabla con header fijo */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header de la tabla - Fijo */}
                <div className="flex-shrink-0 overflow-hidden rounded-t-lg">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Documento
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Cliente
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white hidden sm:table-cell">
                          Fecha/Hora
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white hidden lg:table-cell">
                          Subtotal
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white hidden lg:table-cell">
                          IGV
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white">
                          Total
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white hidden md:table-cell">
                          Estado
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
                          PDF
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Body de la tabla - Scrollable */}
                <div className="flex-1 overflow-auto">
                  <table className="min-w-full">
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentSales.map((sale, index) => {
                          const customerInfo = getCustomerInfo(sale.person)
                          
                          return (
                            <tr 
                              key={sale.id} 
                              className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                              }`}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                    <FileText className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 tracking-tight text-xs">{sale.serial}-{sale.number}</p>
                                    <p className="text-xs text-slate-500 font-mono">{sale.currency}</p>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-3 py-2">
                                <div className="max-w-xs">
                                  <p className={`font-medium tracking-tight text-xs leading-tight truncate ${
                                    sale.person ? 'text-slate-900' : 'text-slate-500 italic'
                                  }`}>
                                    {customerInfo.name}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono truncate">
                                    {customerInfo.type}: {customerInfo.document}
                                  </p>
                                </div>
                              </td>
                              
                              <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                                <div className="flex items-center text-xs space-x-1">
                                  <CalendarDays className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-slate-900 text-xs">
                                      {new Date(sale.emitDate).toLocaleDateString('es-PE')}
                                    </p>
                                    <p className="text-slate-500 flex items-center font-mono text-xs">
                                      <Clock className="w-2.5 h-2.5 mr-1" />
                                      {formatTime(sale.emitTime)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-3 py-2 whitespace-nowrap text-right hidden lg:table-cell">
                                <span className="font-semibold text-slate-900 font-mono text-xs">
                                  {formatCurrency(sale.totalTaxable)}
                                </span>
                              </td>
                              
                              <td className="px-3 py-2 whitespace-nowrap text-right hidden lg:table-cell">
                                <span className="font-medium text-slate-600 font-mono text-xs">
                                  {formatCurrency(sale.igvAmount)}
                                </span>
                              </td>
                              
                              <td className="px-3 py-2 whitespace-nowrap text-right">
                                <span className="font-bold text-sm text-blue-600 font-mono">
                                  {formatCurrency(sale.totalAmount)}
                                </span>
                              </td>                            
                            <td className="px-3 py-2 whitespace-nowrap text-center hidden md:table-cell">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(sale.operationStatus)}`}>
                                {getStatusLabel(sale.operationStatus)}
                              </span>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="relative" ref={dropdownRef}>
                                <button
                                  onClick={() => handleViewPDF(sale)}
                                  className="inline-flex items-center justify-center p-1.5 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Ver PDF"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación Moderna y Dinámica */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    {/* Info de registros y selector de items por página */}
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {searchTerm ? (
                          <>
                            {filteredSales.length > 0 ? (
                              `Encontrados: ${filteredSales.length} de ${sales.length} | Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredSales.length)}`
                            ) : (
                              `No se encontraron resultados para "${searchTerm}"`
                            )}
                          </>
                        ) : (
                          `Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredSales.length)} de ${filteredSales.length} ventas`
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-slate-600 font-medium">Mostrar:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Controles de paginación */}
                    <div className="flex items-center space-x-1">
                      {/* Botón Primera página */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Primera página"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Botón Anterior */}
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Números de página */}
                      <div className="flex items-center space-x-0.5">
                        {currentPage > 3 && totalPages > 7 && (
                          <>
                            <button
                              onClick={() => setCurrentPage(1)}
                              className="px-2 py-1 text-xs rounded-lg text-slate-600 hover:bg-white transition-all hover:shadow-sm font-medium"
                            >
                              1
                            </button>
                            {currentPage > 4 && <span className="px-1 text-slate-400">...</span>}
                          </>
                        )}

                        {generatePageNumbers().map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 text-xs rounded-lg transition-all font-medium ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                : 'text-slate-600 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        {currentPage < totalPages - 2 && totalPages > 7 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="px-2 py-1 text-xs rounded-lg text-slate-600 hover:bg-white transition-all hover:shadow-sm font-medium"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Botón Siguiente */}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Botón Última página */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Última página"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Input directo de página para móvil */}
                    <div className="flex sm:hidden items-center space-x-2">
                      <label className="text-xs text-slate-600">Ir a página:</label>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = Number(e.target.value)
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page)
                          }
                        }}
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600">de {totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de PDF */}
      <PDFViewerModal 
        isOpen={showPDFModal}
        onClose={() => {
          setShowPDFModal(false)
          setSelectedSale(null)
        }}
        sale={selectedSale}
      />

      {/* Botón flotante para móvil */}
      <button
        onClick={() => navigate('/pos')}
        className="fixed bottom-4 right-4 lg:hidden w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}