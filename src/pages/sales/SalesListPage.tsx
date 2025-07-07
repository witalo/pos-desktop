// src/pages/sales/SalesListPage.tsx - Versión refinada con error corregido
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
  Clock
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
  person: {
    id: string
    fullName: string
    document: string
    personType: string
  }
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
type OperationStatus = '1' | '2' | '3' | '4' | '5' | '6'

const STATUS_LABELS: Record<OperationStatus, string> = {
  '1': 'Registrado',
  '2': 'Emitido', 
  '3': 'Pendiente',
  '4': 'Proceso',
  '5': 'Anulado',
  '6': 'Rechazado'
}

const STATUS_COLORS: Record<OperationStatus, string> = {
  '1': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm',
  '2': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm',
  '3': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm',
  '4': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm',
  '5': 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm',
  '6': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalAmount: 0,
    totalItems: 0,
    avgTicket: 0
  })

  // Referencias
  const searchRef = useRef<HTMLInputElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadSales()
  }, [selectedDate, company?.id])

  useEffect(() => {
    searchRef.current?.focus()
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
  // FUNCIONES
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

  // Filtrar ventas por búsqueda
  const filteredSales = sales.filter(sale => 
    sale.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.number.toString().includes(searchTerm) ||
    sale.person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.person.document.includes(searchTerm)
  )

  // Paginación
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSales = filteredSales.slice(startIndex, endIndex)

  const formatTime = (time: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`
  }

  // Función para obtener el estado con tipo seguro
  const getStatusLabel = (status: string): string => {
    return STATUS_LABELS[status as OperationStatus] || 'Desconocido'
  }

  const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status as OperationStatus] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
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
            <span>Nueva Venta</span>
            <kbd className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs font-mono">Ctrl+N</kbd>
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
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
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
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-3 py-1.5 w-48 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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

      {/* Tabla Ultra Refinada */}
      <div className="flex-1 px-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Cargando ventas...</p>
              </div>
            </div>
          ) : currentSales.length === 0 ? (
            <div className="flex items-center justify-center py-12">
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
              {/* Tabla ultra refinada */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                        IGV
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSales.map((sale, index) => (
                      <tr 
                        key={sale.id} 
                        className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                              <FileText className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 tracking-tight text-xs">{sale.serial}-{sale.number}</p>
                              <p className="text-xs text-slate-500 font-mono">{sale.currency}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-slate-900 tracking-tight text-xs leading-tight">{sale.person.fullName}</p>
                            <p className="text-xs text-slate-500 flex items-center font-mono">
                              <span className="mr-1">{sale.person.personType === '6' ? 'RUC:' : 'DNI:'}</span>
                              {sale.person.document}
                            </p>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center text-xs space-x-1">
                            <CalendarDays className="w-3 h-3 text-slate-400" />
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
                        
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className="font-semibold text-slate-900 font-mono text-xs">
                            {formatCurrency(sale.totalTaxable)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className="font-medium text-slate-600 font-mono text-xs">
                            {formatCurrency(sale.igvAmount)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className="font-bold text-sm text-blue-600 font-mono">
                            {formatCurrency(sale.totalAmount)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(sale.operationStatus)}`}>
                            {getStatusLabel(sale.operationStatus)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => {/* Ver detalles */}}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {/* Descargar PDF */}}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {/* Más opciones */}}
                              className="p-1 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación Ultra Compacta */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600 font-medium">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSales.length)} de {filteredSales.length} ventas
                    </div>
                    
                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                          if (pageNum <= totalPages) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-2 py-1 text-xs rounded-lg transition-colors font-medium ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white shadow-sm'
                                }`}
                              >
                                {pageNum}
                              </button>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botón flotante para móvil */}
      <button
        onClick={() => navigate('/pos')}
        className="fixed bottom-3 right-3 lg:hidden w-11 h-11 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}