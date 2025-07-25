import { useState, useEffect, useRef } from 'react'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  BarChart3,
  FileText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Truck,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
  Users,
  Eye,
  X,
  Printer,
  FileDown,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Hash,
  Percent,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'

// =============================================
// TIPOS E INTERFACES
// =============================================
interface DailyReport {
  date: string
  entries: number
  entriesAmount: number
  sales: number
  salesAmount: number
  profit: number
  transactionCount: number
}

interface ProductReport {
  productId: string
  productName: string
  productCode: string
  quantitySold: number
  quantityPurchased: number
  totalSales: number
  totalPurchases: number
  profit: number
  stockMovement: number
}

interface MonthlyStats {
  totalEntries: number
  totalEntriesAmount: number
  totalSales: number
  totalSalesAmount: number
  totalProfit: number
  avgDailySales: number
  avgDailyEntries: number
  bestDay: DailyReport | null
  worstDay: DailyReport | null
  growthRate: number
}

interface PaymentMethodStats {
  method: string
  methodName: string
  count: number
  amount: number
  percentage: number
}

interface CustomerStats {
  customerId: string
  customerName: string
  customerDocument: string
  purchaseCount: number
  totalAmount: number
  avgTicket: number
  lastPurchase: string | null
}

// =============================================
// QUERIES GRAPHQL
// =============================================
const GET_MONTHLY_REPORT_QUERY = `
  query GetMonthlyReport($companyId: ID!, $year: Int!, $month: Int!) {
    monthlyReports(companyId: $companyId, year: $year, month: $month) {
      dailyReports {
        date
        entries
        entriesAmount
        sales
        salesAmount
        profit
        transactionCount
      }
      productReports {
        productId
        productName
        productCode
        quantitySold
        quantityPurchased
        totalSales
        totalPurchases
        profit
        stockMovement
      }
      stats {
        totalEntries
        totalEntriesAmount
        totalSales
        totalSalesAmount
        totalProfit
        avgDailySales
        avgDailyEntries
        growthRate
      }
      paymentMethods {
        method
        methodName
        count
        amount
        percentage
      }
      topCustomers {
        customerId
        customerName
        customerDocument
        purchaseCount
        totalAmount
        avgTicket
        lastPurchase
      }
    }
  }
`

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function ReportPage() {
  const { company, user } = useAuthStore()
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [productReports, setProductReports] = useState<ProductReport[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'payments' | 'customers'>('overview')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedView, setSelectedView] = useState<'daily' | 'comparison'>('daily')
  const [sortBy, setSortBy] = useState<'profit' | 'quantity' | 'sales'>('profit')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Referencias
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadMonthlyReport()
  }, [selectedYear, selectedMonth, company?.id])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // =============================================
  // FUNCIONES DE CARGA DE DATOS
  // =============================================
  const loadMonthlyReport = async () => {
    if (!company?.id) return

    setLoading(true)
    try {
      const { monthlyReports } = await graphqlRequest(GET_MONTHLY_REPORT_QUERY, {
        companyId: company.id,
        year: selectedYear,
        month: selectedMonth
      })

      if (monthlyReports) {
        setDailyReports(monthlyReports.dailyReports || [])
        setProductReports(monthlyReports.productReports || [])
        setPaymentStats(monthlyReports.paymentMethods || [])
        setCustomerStats(monthlyReports.topCustomers || [])
        
        // Calcular estadísticas adicionales
        const stats = monthlyReports.stats
        const bestDay = monthlyReports.dailyReports?.reduce((best: DailyReport | null, current: DailyReport) => 
          !best || current.salesAmount > best.salesAmount ? current : best
        , null)
        
        const worstDay = monthlyReports.dailyReports?.reduce((worst: DailyReport | null, current: DailyReport) => 
          !worst || current.salesAmount < worst.salesAmount ? current : worst
        , null)

        setMonthlyStats({
          ...stats,
          bestDay,
          worstDay
        })
      }
    } catch (error) {
      console.error('Error cargando reporte mensual:', error)
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`
  }

  // const formatDate = (dateString: string | null | undefined) => {
  //   if (!dateString) return '-'
  //   const date = new Date(dateString)
  //   return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  // }
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    
    // Crear fecha en UTC y ajustar a Lima (UTC-5)
    const date = new Date(dateString)
    const limaOffset = -5 * 60 // Lima es UTC-5
    const localOffset = date.getTimezoneOffset()
    const limaTime = new Date(date.getTime() + (localOffset - limaOffset) * 60 * 1000)
    
    return limaTime.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short',
      timeZone: 'America/Lima'
    })
  }
  const getMonthName = (month: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months[month - 1]
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  // Colores para gráficos
  const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6'
  }

  const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.indigo, COLORS.teal]

  // Obtener productos ordenados
  const getSortedProducts = () => {
    return [...productReports].sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return b.profit - a.profit
        case 'quantity':
          return b.quantitySold - a.quantitySold
        case 'sales':
          return b.totalSales - a.totalSales
        default:
          return 0
      }
    })
  }

  // Datos para gráfico de comparación
  const getComparisonData = () => {
    return dailyReports.map(report => ({
      date: formatDate(report.date),
      ventas: report.salesAmount,
      compras: report.entriesAmount,
      ganancia: report.profit
    }))
  }

  // Datos para gráfico de productos top
  const getTopProductsData = () => {
    return getSortedProducts().slice(0, 5).map(product => ({
      name: product.productName.length > 20 ? 
        product.productName.substring(0, 20) + '...' : 
        product.productName,
      ventas: product.totalSales,
      cantidad: product.quantitySold
    }))
  }

  // =============================================
  // FUNCIONES DE EXPORTACIÓN
  // =============================================
  const exportToPDF = () => {
    console.log('Exportando a PDF...')
    // Implementar exportación a PDF
  }

  const exportToExcel = () => {
    console.log('Exportando a Excel...')
    // Implementar exportación a Excel
  }

  const sendByEmail = () => {
    console.log('Enviando por email...')
    // Implementar envío por email
  }

  const print = () => {
    window.print()
  }

  // =============================================
  // RENDERIZADO
  // =============================================
  return (
  <div className="h-screen bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif] overflow-hidden">
    {/* Header Ultra Compacto */}
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Reporte de Entradas y Salidas</h1>
            <p className="text-xs text-slate-300 leading-tight">
              Análisis detallado de operaciones
            </p>
          </div>
        </div>

        {/* Controles del mes */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => changeMonth('prev')}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">
              {getMonthName(selectedMonth)} {selectedYear}
            </h2>
            <p className="text-xs text-slate-300">
              {dailyReports.reduce((sum, report) => sum + report.transactionCount, 0)} transacciones
            </p>
          </div>
          
          <button
            onClick={() => changeMonth('next')}
            disabled={selectedYear === new Date().getFullYear() && selectedMonth >= new Date().getMonth() + 1}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-400 mx-2"></div>

          {/* Botón de exportar */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>
                <button
                  onClick={sendByEmail}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar por Email</span>
                </button>
                <button
                  onClick={print}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Cards de Resumen Ultra Compactos con Animaciones */}
    <div className="px-4 py-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Total Ventas */}
        <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">Ventas</p>
              <p className="text-lg font-bold text-emerald-600 tracking-tight">
                {formatCurrency(monthlyStats?.totalSalesAmount || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {monthlyStats?.totalSales || 0} operaciones
              </p>
            </div>
            <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Total Compras */}
        <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">Compras</p>
              <p className="text-lg font-bold text-red-600 tracking-tight">
                {formatCurrency(monthlyStats?.totalEntriesAmount || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {monthlyStats?.totalEntries || 0} operaciones
              </p>
            </div>
            <div className="p-1.5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Ganancia */}
        <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">Ganancia</p>
              <p className="text-lg font-bold text-blue-600 tracking-tight">
                {formatCurrency(monthlyStats?.totalProfit || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                {monthlyStats?.growthRate !== undefined && (
                  <>
                    {monthlyStats.growthRate > 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    {Math.abs(monthlyStats.growthRate).toFixed(1)}%
                  </>
                )}
              </p>
            </div>
            <div className="p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Promedio Diario */}
        <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">Promedio/Día</p>
              <p className="text-lg font-bold text-purple-600 tracking-tight">
                {formatCurrency(monthlyStats?.avgDailySales || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ventas diarias
              </p>
            </div>
            <div className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Mejor Día */}
        <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">Mejor Día</p>
              <p className="text-lg font-bold text-orange-600 tracking-tight">
                {formatCurrency(monthlyStats?.bestDay?.salesAmount || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {monthlyStats?.bestDay ? formatDate(monthlyStats.bestDay.date) : '-'}
              </p>
            </div>
            <div className="p-1.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <CalendarDays className="w-3.5 h-3.5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Tabs de navegación */}
    <div className="px-4 py-2">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-1 flex space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Vista General</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Productos</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'payments'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Métodos de Pago</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Clientes Top</span>
          </div>
        </button>
      </div>
    </div>

    {/* Contenido Principal - SCROLLABLE */}
    <div className="flex-1 px-4 pb-4 overflow-y-auto min-h-0">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Cargando reporte...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Vista General */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Gráfico de líneas - Comparación diaria */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Comparación Diaria</h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mr-1"></div>
                      <span className="text-slate-600">Ventas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                      <span className="text-slate-600">Compras</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                      <span className="text-slate-600">Ganancia</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={getComparisonData()}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Area type="monotone" dataKey="ventas" stroke="#10B981" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="compras" stroke="#EF4444" fillOpacity={1} fill="url(#colorCompras)" strokeWidth={2} />
                    <Area type="monotone" dataKey="ganancia" stroke="#3B82F6" fillOpacity={1} fill="url(#colorGanancia)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla de resumen diario */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                  <h3 className="text-sm font-bold text-slate-700">Detalle por Día</h3>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Fecha</th>
                        <th className="px-3 py-2 text-right font-semibold text-emerald-600">Ventas</th>
                        <th className="px-3 py-2 text-right font-semibold text-red-600">Compras</th>
                        <th className="px-3 py-2 text-right font-semibold text-blue-600">Ganancia</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700">Trans.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyReports.map((report, index) => {
                        const isWeekend = new Date(report.date).getDay() === 0 || new Date(report.date).getDay() === 6
                        return (
                          <tr 
                            key={report.date} 
                            className={`hover:bg-slate-50 transition-colors ${
                              isWeekend ? 'bg-blue-50/30' : ''
                            } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                          >
                            <td className="px-3 py-2 font-medium text-slate-700">
                              {formatDate(report.date)}
                              {isWeekend && <span className="ml-1 text-xs text-blue-500">(Fin de semana)</span>}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
                              {formatCurrency(report.salesAmount)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-red-600">
                              {formatCurrency(report.entriesAmount)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">
                              {formatCurrency(report.profit)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-6 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                                {report.transactionCount}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico de barras - Top 5 productos */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Top 5 Productos Más Vendidos</h3>
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getTopProductsData()}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="ventas" fill="url(#colorBar)" radius={[8, 8, 0, 0]}>
                      {getTopProductsData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini cards de estadísticas */}
              <div className="space-y-3">
                {/* Transacciones por tipo */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-900 mb-2">Distribución de Transacciones</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/70 rounded-lg p-2 text-center">
                      <ShoppingCart className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-emerald-600">{monthlyStats?.totalSales || 0}</p>
                      <p className="text-xs text-slate-600">Ventas</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2 text-center">
                      <Truck className="w-5 h-5 text-red-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-red-600">{monthlyStats?.totalEntries || 0}</p>
                      <p className="text-xs text-slate-600">Compras</p>
                    </div>
                  </div>
                </div>

                {/* Rendimiento */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">Rendimiento del Mes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Crecimiento</span>
                      <span className={`text-sm font-bold flex items-center ${
                        (monthlyStats?.growthRate || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {(monthlyStats?.growthRate || 0) >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(monthlyStats?.growthRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          (monthlyStats?.growthRate || 0) >= 0 
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${Math.min(Math.abs(monthlyStats?.growthRate || 0), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista de Productos */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 flex flex-col" style={{ minHeight: '500px' }}>
              {/* Header con controles */}
              <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Análisis de Productos</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="profit">Ganancia</option>
                      <option value="quantity">Cantidad</option>
                      <option value="sales">Ventas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla de productos */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Producto</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Código</th>
                      <th className="px-3 py-2 text-right font-semibold text-emerald-600">Vendido</th>
                      <th className="px-3 py-2 text-right font-semibold text-red-600">Comprado</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-600">Ventas</th>
                      <th className="px-3 py-2 text-right font-semibold text-orange-600">Compras</th>
                      <th className="px-3 py-2 text-right font-semibold text-purple-600">Ganancia</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Stock Mov.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getSortedProducts().map((product, index) => {
                      const profitMargin = product.totalSales > 0 
                        ? (product.profit / product.totalSales * 100).toFixed(1)
                        : '0.0'
                      
                      return (
                        <tr 
                          key={product.productId} 
                          className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                              index < 3 
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                         <td className="px-3 py-2">
                           <p className="font-semibold text-slate-900 truncate max-w-xs" title={product.productName}>
                             {product.productName}
                           </p>
                         </td>
                         <td className="px-3 py-2 text-center">
                           <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                             {product.productCode}
                           </span>
                         </td>
                         <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
                           {product.quantitySold}
                         </td>
                         <td className="px-3 py-2 text-right font-mono font-semibold text-red-600">
                           {product.quantityPurchased}
                         </td>
                         <td className="px-3 py-2 text-right font-mono font-semibold text-blue-600">
                           {formatCurrency(product.totalSales)}
                         </td>
                         <td className="px-3 py-2 text-right font-mono font-semibold text-orange-600">
                           {formatCurrency(product.totalPurchases)}
                         </td>
                         <td className="px-3 py-2 text-right">
                           <div>
                             <p className="font-mono font-bold text-purple-600">
                               {formatCurrency(product.profit)}
                             </p>
                             <p className="text-xs text-slate-500">
                               {profitMargin}%
                             </p>
                           </div>
                         </td>
                         <td className="px-3 py-2 text-center">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                             product.stockMovement > 0 
                               ? 'bg-emerald-100 text-emerald-700'
                               : product.stockMovement < 0
                               ? 'bg-red-100 text-red-700'
                               : 'bg-slate-100 text-slate-700'
                           }`}>
                             {product.stockMovement > 0 && '+'}{product.stockMovement}
                           </span>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {/* Vista de Métodos de Pago */}
         {activeTab === 'payments' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
             {/* Gráfico circular */}
             <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200/60">
               <h3 className="text-sm font-bold text-slate-700 mb-3">Distribución de Métodos de Pago</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <RePieChart>
                   <Pie
                     data={paymentStats}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={(entry: any) => `${entry.percentage.toFixed(0)}%`}
                     outerRadius={100}
                     fill="#8884d8"
                     dataKey="amount"
                   >
                     {paymentStats.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                     formatter={(value: number) => formatCurrency(value)}
                     contentStyle={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                       border: '1px solid #e2e8f0',
                       borderRadius: '8px',
                       fontSize: '12px'
                     }} 
                   />
                 </RePieChart>
               </ResponsiveContainer>
               
               {/* Leyenda personalizada */}
               <div className="grid grid-cols-2 gap-2 mt-4">
                 {paymentStats.map((stat, index) => (
                   <div key={stat.method} className="flex items-center space-x-2">
                     <div 
                       className="w-3 h-3 rounded-full" 
                       style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                     ></div>
                     <span className="text-xs text-slate-600">{stat.methodName}</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Tabla de detalles */}
             <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
               <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                 <h3 className="text-sm font-bold text-slate-700">Detalle de Métodos de Pago</h3>
               </div>
               <div className="p-4">
                 {paymentStats.map((stat, index) => {
                   const icon = stat.method === 'E' ? '💵' : 
                               stat.method === 'Y' ? '📱' :
                               stat.method === 'P' ? '📱' :
                               stat.method === 'T' ? '💳' : '🏦'
                   
                   return (
                     <div 
                       key={stat.method}
                       className="mb-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:shadow-md transition-all duration-300"
                     >
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center space-x-3">
                           <span className="text-2xl">{icon}</span>
                           <div>
                             <p className="font-semibold text-slate-900">{stat.methodName}</p>
                             <p className="text-xs text-slate-500">{stat.count} transacciones</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="font-bold text-lg text-blue-600">{formatCurrency(stat.amount)}</p>
                           <p className="text-xs text-slate-500">{stat.percentage.toFixed(1)}%</p>
                         </div>
                       </div>
                       <div className="w-full bg-slate-200 rounded-full h-2">
                         <div 
                           className="h-2 rounded-full transition-all duration-500"
                           style={{ 
                             width: `${stat.percentage}%`,
                             backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                           }}
                         ></div>
                       </div>
                     </div>
                   )
                 })}
               </div>
             </div>
           </div>
         )}

         {/* Vista de Clientes */}
         {activeTab === 'customers' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 flex flex-col" style={{ minHeight: '500px' }}>
             <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
               <h3 className="text-sm font-bold text-slate-700">Top 10 Clientes del Mes</h3>
             </div>
             
             <div className="flex-1 overflow-auto">
               <table className="w-full text-xs">
                 <thead className="bg-slate-50 sticky top-0">
                   <tr>
                     <th className="px-3 py-2 text-left font-semibold text-slate-700">#</th>
                     <th className="px-3 py-2 text-left font-semibold text-slate-700">Cliente</th>
                     <th className="px-3 py-2 text-center font-semibold text-slate-700">Documento</th>
                     <th className="px-3 py-2 text-center font-semibold text-slate-700">Compras</th>
                     <th className="px-3 py-2 text-right font-semibold text-blue-600">Total</th>
                     <th className="px-3 py-2 text-right font-semibold text-purple-600">Ticket Prom.</th>
                     <th className="px-3 py-2 text-center font-semibold text-slate-700">Última Compra</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {customerStats.slice(0, 10).map((customer, index) => (
                     <tr 
                       key={customer.customerId}
                       className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                         index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                       }`}
                     >
                       <td className="px-3 py-2 text-center">
                         <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                           index < 3 
                             ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                             : 'bg-gradient-to-br from-slate-400 to-slate-500'
                         }`}>
                           {index + 1}
                         </span>
                       </td>
                       <td className="px-3 py-2">
                         <div>
                           <p className="font-semibold text-slate-900 truncate max-w-xs">
                             {customer.customerName}
                           </p>
                           {index < 3 && (
                             <span className="text-xs text-orange-500 font-semibold">⭐ Cliente VIP</span>
                           )}
                         </div>
                       </td>
                       <td className="px-3 py-2 text-center">
                         <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                           {customer.customerDocument}
                         </span>
                       </td>
                       <td className="px-3 py-2 text-center">
                         <span className="inline-flex items-center justify-center w-8 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-700">
                           {customer.purchaseCount}
                         </span>
                       </td>
                       <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">
                         {formatCurrency(customer.totalAmount)}
                       </td>
                       <td className="px-3 py-2 text-right font-mono font-semibold text-purple-600">
                         {formatCurrency(customer.avgTicket)}
                       </td>
                       <td className="px-3 py-2 text-center text-slate-600">
                         {formatDate(customer.lastPurchase)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
       </>
     )}
   </div>
 </div>
)
}