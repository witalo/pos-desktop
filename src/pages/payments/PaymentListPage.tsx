// src/pages/payments/PaymentListPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  User,
  FileText,
  X,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  Hash,
  Edit3,
  MoreVertical
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// TIPOS E INTERFACES
// =============================================
interface Payment {
  id: string
  type: 'I' | 'E'
  paymentType: 'CN' | 'CR'
  paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
  status: 'P' | 'C'
  notes?: string
  paymentDate: string
  totalAmount: number
  paidAmount: number
  operation?: {
    id: string
    serial: string
    number: number
    totalAmount: number
  } | null
  user: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  company: {
    id: string
    denomination: string
  }
}

interface CashFlowStats {
  totalIncome: number
  totalExpense: number
  netBalance: number
  totalMovements: number
  pendingPayments: number
  completedPayments: number
}

// =============================================
// QUERIES GRAPHQL
// =============================================
const GET_PAYMENTS_BY_DATE_QUERY = `
  query GetPaymentsByDate($companyId: Int!, $date: String!) {
    paymentsByDate(companyId: $companyId, date: $date) {
      id
      type
      paymentType
      paymentMethod
      status
      notes
      paymentDate
      totalAmount
      paidAmount
      operation {
        id
        serial
        number
        totalAmount
      }
      user {
        id
        username
        firstName
        lastName
      }
      company {
        id
        denomination
      }
    }
  }
`

// =============================================
// MAPEOS Y CONSTANTES
// =============================================
const TYPE_LABELS: Record<string, string> = {
  'I': 'Ingreso',
  'E': 'Egreso'
}

const TYPE_COLORS: Record<string, string> = {
  'I': 'text-emerald-600',
  'E': 'text-red-600'
}

const TYPE_BG_COLORS: Record<string, string> = {
  'I': 'bg-emerald-50',
  'E': 'bg-red-50'
}

const TYPE_ICONS: Record<string, JSX.Element> = {
  'I': <ArrowDownCircle className="w-4 h-4" />,
  'E': <ArrowUpCircle className="w-4 h-4" />
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  'CN': 'Contado',
  'CR': 'Crédito'
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'E': 'Efectivo',
  'Y': 'Yape',
  'P': 'Plin',
  'T': 'Tarjeta',
  'B': 'Transferencia'
}

const PAYMENT_METHOD_ICONS: Record<string, JSX.Element> = {
  'E': <Banknote className="w-3.5 h-3.5" />,
  'Y': <Smartphone className="w-3.5 h-3.5" />,
  'P': <Smartphone className="w-3.5 h-3.5" />,
  'T': <CreditCard className="w-3.5 h-3.5" />,
  'B': <Building2 className="w-3.5 h-3.5" />
}

const STATUS_LABELS: Record<string, string> = {
  'P': 'Pendiente',
  'C': 'Cancelado'
}

const STATUS_COLORS: Record<string, string> = {
  'P': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
  'C': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function PaymentListPage() {
  const navigate = useNavigate()
  const { company } = useAuthStore()
  
  // Estados
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'I' | 'E'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'P' | 'C'>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | 'E' | 'Y' | 'P' | 'T' | 'B'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [stats, setStats] = useState<CashFlowStats>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    totalMovements: 0,
    pendingPayments: 0,
    completedPayments: 0
  })

  // Referencias
  const searchRef = useRef<HTMLInputElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadPayments()
  }, [selectedDate, company?.id])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/payments/new')
      } else if (e.key === 'F5') {
        e.preventDefault()
        loadPayments()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  }

const formatCurrency = (amount: any) => {
  const num = Number(amount);
  if (isNaN(num)) return 'S/ 0.00';
  return `S/ ${num.toFixed(2)}`;
}

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
  const loadPayments = async () => {
    if (!company?.id) return

    setLoading(true)
    try {
      const { paymentsByDate } = await graphqlRequest(GET_PAYMENTS_BY_DATE_QUERY, {
        companyId: company.id,
        date: selectedDate
      })

      setPayments(paymentsByDate || [])
      calculateStats(paymentsByDate || [])
      setCurrentPage(1)
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentsData: Payment[]) => {
    const stats = paymentsData.reduce((acc, payment) => {
      if (payment.type === 'I') {
        acc.totalIncome += payment.paidAmount
      } else {
        acc.totalExpense += payment.paidAmount
      }
      
      if (payment.status === 'P') {
        acc.pendingPayments++
      } else {
        acc.completedPayments++
      }
      
      acc.totalMovements++
      return acc
    }, {
      totalIncome: 0,
      totalExpense: 0,
      totalMovements: 0,
      pendingPayments: 0,
      completedPayments: 0,
      netBalance:0
    })

    stats.netBalance = stats.totalIncome - stats.totalExpense

    setStats(stats as CashFlowStats)
  }

  // Filtrar pagos
  const filteredPayments = payments.filter(payment => {
    // Filtro por tipo
    if (typeFilter !== 'all' && payment.type !== typeFilter) return false
    
    // Filtro por estado
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false
    
    // Filtro por método
    if (methodFilter !== 'all' && payment.paymentMethod !== methodFilter) return false
    
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      
      // Buscar en notas
      if (payment.notes && payment.notes.toLowerCase().includes(searchLower)) return true
      
      // Buscar en monto
      if (payment.paidAmount.toString().includes(searchTerm)) return true
      
      // Buscar en usuario
      const userName = `${payment.user.firstName} ${payment.user.lastName}`.toLowerCase()
      if (userName.includes(searchLower)) return true
      
      // Buscar en documento de operación
      if (payment.operation) {
        const doc = `${payment.operation.serial}-${payment.operation.number}`.toLowerCase()
        if (doc.includes(searchLower)) return true
      }
      
      return false
    }
    
    return true
  })

  // Paginación
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = filteredPayments.slice(startIndex, endIndex)

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
      {/* Header Ultra Moderno */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Flujo de Caja</h1>
              <p className="text-xs text-slate-300 leading-tight">
                Control de ingresos y egresos
              </p>
            </div>
          </div>
          
          {/* Botón Nuevo Movimiento */}
          <button
            onClick={() => navigate('/payment')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Movimiento</span>
            <kbd className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs font-mono hidden lg:inline">Ctrl+N</kbd>
          </button>
        </div>
      </div>

      {/* Resumen del Flujo de Caja - Ultra Compacto */}
      <div className="px-4 py-2.5">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Ingresos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Ingresos</p>
                  <p className="text-lg font-bold text-emerald-400 tracking-tight">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Egresos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Egresos</p>
                  <p className="text-lg font-bold text-red-400 tracking-tight">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <div className="p-1.5 bg-red-500/20 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </div>

            {/* Balance Neto */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Balance Neto</p>
                  <p className={`text-lg font-bold tracking-tight ${
                    stats.netBalance >= 0 ? 'text-cyan-400' : 'text-orange-400'
                  }`}>
                    {formatCurrency(stats.netBalance)}
                  </p>
                </div>
                <div className={`p-1.5 rounded-lg ${
                  stats.netBalance >= 0 ? 'bg-cyan-500/20' : 'bg-orange-500/20'
                }`}>
                  <DollarSign className={`w-4 h-4 ${
                    stats.netBalance >= 0 ? 'text-cyan-400' : 'text-orange-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Total Movimientos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 hidden lg:block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Movimientos</p>
                  <p className="text-lg font-bold text-white tracking-tight">{stats.totalMovements}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-emerald-400">{stats.completedPayments} OK</span>
                    <span className="text-xs text-amber-400">{stats.pendingPayments} Pend.</span>
                  </div>
                </div>
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y Filtros Ultra Compactos */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-200/60">
          <div className="flex flex-col space-y-2">
            {/* Primera fila: Fecha y búsqueda */}
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
                    placeholder="Buscar en notas, montos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
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
                  onClick={loadPayments}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center space-x-1 text-xs font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {/* Segunda fila: Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              
              {/* Filtro por tipo */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="I">Solo Ingresos</option>
                <option value="E">Solo Egresos</option>
              </select>

              {/* Filtro por estado */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="C">Cancelados</option>
                <option value="P">Pendientes</option>
              </select>

              {/* Filtro por método */}
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los métodos</option>
                <option value="E">Efectivo</option>
                <option value="Y">Yape</option>
                <option value="P">Plin</option>
                <option value="T">Tarjeta</option>
                <option value="B">Transferencia</option>
              </select>

              {/* Indicador de filtros activos */}
              {(typeFilter !== 'all' || statusFilter !== 'all' || methodFilter !== 'all') && (
                <button
                  onClick={() => {
                    setTypeFilter('all')
                    setStatusFilter('all')
                    setMethodFilter('all')
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 h-full flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Cargando movimientos...</p>
              </div>
            </div>
          ) : currentPayments.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-500 mb-1">No hay movimientos</p>
                <p className="text-slate-400 text-xs mb-3">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || methodFilter !== 'all' 
                    ? 'No se encontraron movimientos con los filtros aplicados' 
                    : 'Registra un ingreso o egreso'}
                </p>
                <button
                  onClick={() => navigate('/payment')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-1.5 mx-auto text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Movimiento</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header de tabla fijo */}
              <div className="flex-shrink-0 overflow-hidden rounded-t-lg">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                        Tipo
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                        Descripción
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white hidden sm:table-cell">
                        Método
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white hidden lg:table-cell">
                        Usuario
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white">
                        Monto
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white hidden md:table-cell">
                        Estado
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
                        Hora
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Body de tabla scrollable */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPayments.map((payment, index) => (
                      <tr 
                        key={payment.id} 
                        className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className={`flex items-center space-x-2 ${TYPE_COLORS[payment.type]}`}>
                            <div className={`p-1.5 rounded-lg ${TYPE_BG_COLORS[payment.type]}`}>
                              {TYPE_ICONS[payment.type]}
                            </div>
                            <span className="font-semibold text-xs">
                              {TYPE_LABELS[payment.type]}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2">
                          <div className="max-w-xs">
                            <p className="font-medium text-slate-900 text-xs leading-tight">
                              {payment.notes || 'Sin descripción'}
                            </p>
                            {payment.operation && (
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Doc: {payment.operation.serial}-{payment.operation.number}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center space-x-1.5">
                            <div className="p-1 bg-slate-100 rounded">
                              {PAYMENT_METHOD_ICONS[payment.paymentMethod]}
                            </div>
                            <div>
                              <p className="font-medium text-xs text-slate-900">
                                {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                              </p>
                              <p className="text-xs text-slate-500">
                                {PAYMENT_TYPE_LABELS[payment.paymentType]}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-slate-100 rounded-full">
                              <User className="w-3 h-3 text-slate-600" />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">
                              {payment.user.firstName} {payment.user.lastName}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className={`font-bold text-sm font-mono ${
                            payment.type === 'I' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {payment.type === 'I' ? '+' : '-'} {formatCurrency(payment.paidAmount)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-center hidden md:table-cell">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[payment.status]}`}>
                            {STATUS_LABELS[payment.status]}
                          </span>
                        </td>
                        
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => navigate(`/payment/${payment.id}`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar movimiento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center justify-center text-xs text-slate-600">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="font-mono">{formatTime(payment.paymentDate)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    {/* Info de registros */}
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {filteredPayments.length > 0 ? (
                          `Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredPayments.length)} de ${filteredPayments.length} movimientos`
                        ) : (
                          'No se encontraron movimientos'
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botón flotante para móvil */}
      <button
        onClick={() => navigate('/payments/new')}
        className="fixed bottom-4 right-4 lg:hidden w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}