// src/pages/sales/SalesListPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter,
  Calendar,
  Plus,
  Download,
  Eye,
  FileText,
  Users,
  DollarSign,
  ArrowRight,
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
  totalIgv: number
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
      totalIgv
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

const STATUS_LABELS = {
  '1': 'Registrado',
  '2': 'Emitido', 
  '3': 'Pendiente Baja',
  '4': 'En Proceso Baja',
  '5': 'Dado de Baja',
  '6': 'Rechazado'
}

const STATUS_COLORS = {
  '1': 'bg-blue-100 text-blue-800',
  '2': 'bg-green-100 text-green-800',
  '3': 'bg-yellow-100 text-yellow-800',
  '4': 'bg-orange-100 text-orange-800',
  '5': 'bg-red-100 text-red-800',
  '6': 'bg-gray-100 text-gray-800'
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
  const [itemsPerPage] = useState(10)
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
    // Enfocar búsqueda al cargar
    searchRef.current?.focus()
  }, [])

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - Nueva venta
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/pos')
      }
      // F5 - Refrescar
      else if (e.key === 'F5') {
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
        operationType: 'S' // S = Salida (Ventas)
      })

      setSales(operationsByDate || [])
      calculateStats(operationsByDate || [])
      setCurrentPage(1) // Reset pagination
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
    return time.substring(0, 5) // HH:mm
  }

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`
  }

  // =============================================
  // RENDERIZADO
  // =============================================
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-7 h-7 mr-3 text-blue-600" />
              Lista de Ventas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona y consulta todas tus ventas realizadas
            </p>
          </div>
          
          {/* Botón Nueva Venta */}
          <button
            onClick={() => navigate('/pos')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
            <kbd className="ml-2 px-2 py-1 bg-white/20 rounded text-xs">Ctrl+N</kbd>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Importe Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Items Vendidos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalItems}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ticket Promedio</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.avgTicket)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Controles */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Selector de Fecha */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Fecha:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por serie, número, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={loadSales}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando ventas...</p>
              </div>
            </div>
          ) : currentSales.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-500 mb-2">No hay ventas registradas</p>
                <p className="text-gray-400 mb-6">
                  {searchTerm ? 'No se encontraron ventas con ese criterio de búsqueda' : 'Registra tu primera venta del día'}
                </p>
                <button
                  onClick={() => navigate('/pos')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Primera Venta</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        IGV
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{sale.serial}-{sale.number}</p>
                              <p className="text-xs text-gray-500">{sale.currency}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{sale.person.fullName}</p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <span className="mr-1">{sale.person.personType === '6' ? 'RUC:' : 'DNI:'}</span>
                              {sale.person.document}
                            </p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(sale.emitDate).toLocaleDateString('es-PE')}
                              </p>
                              <p className="text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(sale.emitTime)}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(sale.totalTaxable)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-medium text-gray-600">
                            {formatCurrency(sale.totalIgv)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-bold text-lg text-blue-600">
                            {formatCurrency(sale.totalAmount)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[sale.operationStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[sale.operationStatus] || 'Desconocido'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {/* Ver detalles */}}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {/* Descargar PDF */}}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {/* Más opciones */}}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSales.length)} de {filteredSales.length} ventas
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                          if (pageNum <= totalPages) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-200'
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
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botón flotante para nueva venta en móvil */}
      <button
        onClick={() => navigate('/pos')}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center hover:scale-110"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}