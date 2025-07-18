// // src/pages/purchases/PurchaseListPage.tsx
// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { 
//   ShoppingBag,
//   Plus,
//   Search,
//   Calendar,
//   FileText,
//   Eye,
//   Trash2,
//   Download,
//   Filter,
//   TrendingUp,
//   Package,
//   DollarSign,
//   RefreshCw,
//   Loader2,
//   Printer,
//   ChevronLeft,
//   ChevronRight
// } from 'lucide-react'
// import { useAuthStore } from '../../store/authStore'
// import { graphqlRequest } from '../../services/graphql'
// import PDFViewerModal from '../components/PDFViewerModal'

// // =============================================
// // INTERFACES
// // =============================================
// interface Purchase {
//   id: string
//   serial?: string
//   number?: string
//   operationDate: string
//   emitDate: string
//   emitTime: string
//   operationStatus: string
//   currency: string
//   totalAmount: number
//   totalTaxable: number
//   igvAmount: number
//   person: {
//     id: string
//     fullName: string
//     document: string
//     personType: string
//   }
//   user: {
//     id: string
//     firstName: string
//     lastName: string
//   }
//   details: Array<{
//     id: string
//     quantity: number
//     totalAmount: number
//   }>
// }

// interface PurchaseStats {
//   totalPurchases: number
//   totalAmount: number
//   avgTicket: number
//   totalItems: number
// }

// // =============================================
// // QUERIES GRAPHQL
// // =============================================
// const GET_PURCHASES_BY_DATE_QUERY = `
//   query GetPurchasesByDate($companyId: ID!, $date: String!) {
//     operationsByDate(companyId: $companyId, date: $date, operationType: "E") {
//       id
//       serial
//       number
//       operationDate
//       emitDate
//       emitTime
//       operationStatus
//       currency
//       totalAmount
//       totalTaxable
//       totalUnaffected
//       totalExempt
//       totalFree
//       igvAmount
//       globalDiscount
//       globalDiscountPercent
//       totalDiscount
//       person {
//         id
//         fullName
//         document
//         personType
//         address
//         phone
//         email
//       }
//       user {
//         id
//         firstName
//         lastName
//       }
//       details {
//         id
//         quantity
//         totalAmount
//       }
//       createdAt
//       updatedAt
//     }
//   }
// `

// const CANCEL_PURCHASE_MUTATION = `
//   mutation CancelPurchase($operationId: ID!, $reason: String!) {
//     cancelOperation(operationId: $operationId, reason: $reason) {
//       success
//       message
//       operation {
//         id
//         operationStatus
//       }
//     }
//   }
// `

// // =============================================
// // COMPONENTE PRINCIPAL
// // =============================================
// export default function PurchaseListPage() {
//   const navigate = useNavigate()
//   const { company, user } = useAuthStore()
  
//   // Estados
//   const [purchases, setPurchases] = useState<Purchase[]>([])
//   const [loading, setLoading] = useState(false)
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
//   const [searchTerm, setSearchTerm] = useState('')
//   const [stats, setStats] = useState<PurchaseStats>({
//     totalPurchases: 0,
//     totalAmount: 0,
//     avgTicket: 0,
//     totalItems: 0
//   })
  
//   // Estados para PDF
//   const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
//   const [showPDFModal, setShowPDFModal] = useState(false)

//   // Cargar compras al iniciar o cambiar fecha
//   useEffect(() => {
//     loadPurchases()
//   }, [selectedDate, company?.id])

//   // Cargar compras
//   const loadPurchases = async () => {
//     if (!company?.id) return
    
//     setLoading(true)
//     try {
//       const { operationsByDate } = await graphqlRequest(GET_PURCHASES_BY_DATE_QUERY, {
//         companyId: company.id,
//         date: selectedDate
//       })
      
//       setPurchases(operationsByDate || [])
//       calculateStats(operationsByDate || [])
//     } catch (error) {
//       console.error('Error cargando compras:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Calcular estadísticas
//   const calculateStats = (purchaseList: Purchase[]) => {
//     const validPurchases = purchaseList.filter(p => p.operationStatus !== '3') // No anuladas
    
//     const totalAmount = validPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
//     const totalItems = validPurchases.reduce((sum, p) => 
//       sum + p.details.reduce((itemSum, d) => itemSum + d.quantity, 0), 0
//     )
    
//     setStats({
//       totalPurchases: validPurchases.length,
//       totalAmount,
//       avgTicket: validPurchases.length > 0 ? totalAmount / validPurchases.length : 0,
//       totalItems
//     })
//   }

//   // Filtrar compras
//   const filteredPurchases = purchases.filter(purchase => {
//     const searchLower = searchTerm.toLowerCase()
//     return (
//       purchase.person.fullName.toLowerCase().includes(searchLower) ||
//       purchase.person.document.includes(searchTerm) ||
//       (purchase.serial && purchase.serial.toLowerCase().includes(searchLower)) ||
//       (purchase.number && purchase.number.toString().includes(searchTerm))
//     )
//   })

//   // Anular compra
//   const handleCancelPurchase = async (purchaseId: string) => {
//     const reason = prompt('Motivo de anulación:')
//     if (!reason) return
    
//     try {
//       const { cancelOperation } = await graphqlRequest(CANCEL_PURCHASE_MUTATION, {
//         operationId: purchaseId,
//         reason
//       })
      
//       if (cancelOperation.success) {
//         alert('Compra anulada exitosamente')
//         loadPurchases()
//       } else {
//         alert(`Error: ${cancelOperation.message}`)
//       }
//     } catch (error) {
//       console.error('Error anulando compra:', error)
//       alert('Error al anular la compra')
//     }
//   }

//   // Ver PDF
//   const handleViewPDF = (purchaseId: string) => {
//     setSelectedPurchaseId(purchaseId)
//     setShowPDFModal(true)
//   }

//   // Navegar a fechas
//   const navigateDate = (days: number) => {
//     const currentDate = new Date(selectedDate)
//     currentDate.setDate(currentDate.getDate() + days)
//     setSelectedDate(currentDate.toISOString().split('T')[0])
//   }

//   // Obtener estado badge
//   const getStatusBadge = (status: string) => {
//     switch(status) {
//       case '1':
//         return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">Borrador</span>
//       case '2':
//         return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Registrado</span>
//       case '3':
//         return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Anulado</span>
//       default:
//         return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Desconocido</span>
//     }
//   }
  

//   return (
//     <div className="h-full bg-slate-50 flex flex-col">
//       {/* Header Ultra Moderno */}
//       <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white px-6 py-4 shadow-xl">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
//               <ShoppingBag className="w-6 h-6" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight">Lista de Compras</h1>
//               <p className="text-purple-200 text-sm">Gestiona y consulta todas tus compras realizadas</p>
//             </div>
//           </div>
//           <button
//             onClick={() => navigate('/purchases/new')}
//             className="bg-white text-purple-800 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
//           >
//             <Plus className="w-5 h-5" />
//             <span>Nueva Compra</span>
//             <kbd className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">Ctrl+N</kbd>
//           </button>
//         </div>
//       </div>

//       {/* Estadísticas Ultra Modernas */}
//       <div className="px-6 py-4 bg-white border-b border-gray-200">
//         <div className="grid grid-cols-4 gap-4">
//           <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-blue-600 text-sm font-medium">Total Compras</p>
//                 <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalPurchases}</p>
//               </div>
//               <div className="bg-blue-200/50 p-3 rounded-lg">
//                 <FileText className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-green-600 text-sm font-medium">Importe Total</p>
//                 <p className="text-2xl font-bold text-green-900 mt-1">S/ {stats.totalAmount.toFixed(2)}</p>
//               </div>
//               <div className="bg-green-200/50 p-3 rounded-lg">
//                 <DollarSign className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-purple-600 text-sm font-medium">Items Comprados</p>
//                 <p className="text-2xl font-bold text-purple-900 mt-1">{stats.totalItems}</p>
//               </div>
//               <div className="bg-purple-200/50 p-3 rounded-lg">
//                 <Package className="w-6 h-6 text-purple-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-orange-600 text-sm font-medium">Ticket Promedio</p>
//                 <p className="text-2xl font-bold text-orange-900 mt-1">S/ {stats.avgTicket.toFixed(2)}</p>
//               </div>
//               <div className="bg-orange-200/50 p-3 rounded-lg">
//                 <TrendingUp className="w-6 h-6 text-orange-600" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Controles de Búsqueda y Fecha */}
//       <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           {/* Selector de fecha con navegación */}
//           <div className="flex items-center space-x-3">
//             <Calendar className="w-5 h-5 text-gray-500" />
//             <span className="text-sm font-medium text-gray-700">Fecha:</span>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => navigateDate(-1)}
//                 className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//               />
//               <button
//                 onClick={() => navigateDate(1)}
//                 className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
//                 className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
//               >
//                 Hoy
//               </button>
//             </div>
//           </div>

//           {/* Buscador */}
//           <div className="flex items-center space-x-4">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Buscar por proveedor, documento, serie..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//               />
//               <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
//             </div>
//             <button
//               onClick={loadPurchases}
//               disabled={loading}
//               className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
//             >
//               <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Tabla de Compras */}
//       <div className="flex-1 overflow-auto px-6 py-4">
//         {loading ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="text-center">
//               <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
//               <p className="text-gray-600">Cargando compras...</p>
//             </div>
//           </div>
//         ) : filteredPurchases.length === 0 ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="text-center">
//               <div className="bg-gray-100 rounded-full p-8 mx-auto mb-4 w-fit">
//                 <ShoppingBag className="w-16 h-16 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay compras registradas</h3>
//               <p className="text-gray-500 mb-4">No se encontraron compras para la fecha seleccionada</p>
//               <button
//                 onClick={() => navigate('/purchases/new')}
//                 className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
//               >
//                 Registrar Primera Compra
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-purple-900 to-purple-800 text-white">
//                   <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Documento</th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Proveedor</th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Fecha/Hora</th>
//                   <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Subtotal</th>
//                   <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">IGV</th>
//                   <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
//                   <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Estado</th>
//                   <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Acciones</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {filteredPurchases.map((purchase) => (
//                   <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="bg-purple-100 p-2 rounded-lg mr-3">
//                           <FileText className="w-5 h-5 text-purple-600" />
//                         </div>
//                         <div>
//                           <div className="text-sm font-bold text-gray-900">
//                             {purchase.serial || 'S/N'}-{purchase.number || 'S/N'}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             {purchase.operationStatus === '3' ? 'ANULADO' : 'COMPRA'}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900">{purchase.person.fullName}</div>
//                         <div className="text-xs text-gray-500">
//                           {purchase.person.personType === '6' ? 'RUC' : 'DNI'}: {purchase.person.document}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">
//                         {new Date(purchase.emitDate).toLocaleDateString('es-PE')}
//                       </div>
//                       <div className="text-xs text-gray-500">{purchase.emitTime}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right">
//                       <span className="text-sm font-mono text-gray-900">
//                         S/ {(purchase.totalTaxable || 0).toFixed(2)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right">
//                       <span className="text-sm font-mono text-gray-900">
//                         S/ {(purchase.igvAmount || 0).toFixed(2)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right">
//                       <span className="text-base font-bold font-mono text-purple-600">
//                         S/ {purchase.totalAmount.toFixed(2)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-center">
//                       {getStatusBadge(purchase.operationStatus)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-center">
//                       <div className="flex items-center justify-center space-x-2">
//                         <button
//                           onClick={() => handleViewPDF(purchase.id)}
//                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                           title="Ver PDF"
//                         >
//                           <Eye className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleViewPDF(purchase.id)}
//                           className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                           title="Imprimir"
//                         >
//                           <Printer className="w-4 h-4" />
//                         </button>
//                         {purchase.operationStatus !== '3' && (
//                           <button
//                             onClick={() => handleCancelPurchase(purchase.id)}
//                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                             title="Anular"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Modal de PDF */}
//       <PDFViewerModal 
//         isOpen={showPDFModal}
//         onClose={() => {
//           setShowPDFModal(false)
//           setSelectedPurchaseId(null)
//         }}
//         saleId={selectedPurchaseId}
//       />
//     </div>
//   )
// }

// src/pages/purchases/PurchaseListPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  FileText,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  ChevronsLeft,
  ChevronsRight,
  Package,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'
import PDFViewerModal from '../components/PDFViewerModal'

interface Purchase {
  id: string
  serial?: string
  number?: string
  operationDate: string
  emitDate: string
  emitTime: string
  operationStatus: string
  currency: string
  totalAmount: number
  totalTaxable: number
  igvAmount: number
  person?: {
    id: string
    fullName: string
    document: string
    personType: string
  } | null
  user: {
    id: string
    firstName: string
    lastName: string
  }
  details: Array<{
    id: string
    quantity: number
    totalAmount: number
  }>
}

interface PurchaseStats {
  totalPurchases: number
  totalAmount: number
  avgTicket: number
  totalItems: number
}

const GET_PURCHASES_BY_DATE_QUERY = `
  query GetPurchasesByDate($companyId: ID!, $date: String!) {
    operationsByDate(companyId: $companyId, date: $date, operationType: "E") {
      id
      serial
      number
      operationDate
      emitDate
      emitTime
      operationStatus
      currency
      totalAmount
      totalTaxable
      igvAmount
      person {
        id
        fullName
        document
        personType
      }
      user {
        id
        firstName
        lastName
      }
      details {
        id
        quantity
        totalAmount
      }
    }
  }
`

const CANCEL_PURCHASE_MUTATION = `
  mutation CancelPurchase($operationId: ID!, $reason: String!) {
    cancelOperation(operationId: $operationId, reason: $reason) {
      success
      message
      operation {
        id
        operationStatus
      }
    }
  }
`

const STATUS_COLORS: Record<string, string> = {
  '1': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm',
  '2': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm',
  '3': 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'
}

const STATUS_LABELS: Record<string, string> = {
  '1': 'Borrador',
  '2': 'Registrado',
  '3': 'Anulado'
}

export default function PurchaseListPage() {
  const navigate = useNavigate()
  const { company } = useAuthStore()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)

// Función para obtener la fecha local actual
  const getLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [selectedDate, setSelectedDate] = useState(getLocalDate())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
  const [stats, setStats] = useState<PurchaseStats>({
    totalPurchases: 0,
    totalAmount: 0,
    avgTicket: 0,
    totalItems: 0
  })
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPurchases()
  }, [selectedDate, company?.id])

  const loadPurchases = async () => {
    if (!company?.id) return
    
    setLoading(true)
    try {
      const { operationsByDate } = await graphqlRequest(GET_PURCHASES_BY_DATE_QUERY, {
        companyId: company.id,
        date: selectedDate
      })
      
      setPurchases(operationsByDate || [])
      calculateStats(operationsByDate || [])
    } catch (error) {
      console.error('Error cargando compras:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (purchaseList: Purchase[]) => {
    const validPurchases = purchaseList.filter(p => p.operationStatus !== '3')
    const totalAmount = validPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalItems = validPurchases.reduce((sum, p) => 
      sum + p.details.reduce((itemSum, d) => itemSum + d.quantity, 0), 0)
    
    setStats({
      totalPurchases: validPurchases.length,
      totalAmount,
      avgTicket: validPurchases.length > 0 ? totalAmount / validPurchases.length : 0,
      totalItems
    })
  }

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase()
    
    // Verificar si existe la persona antes de acceder a sus propiedades
    const personName = purchase.person?.fullName?.toLowerCase() || ''
    const personDoc = purchase.person?.document || ''
    
    return (
      personName.includes(searchLower) ||
      personDoc.includes(searchTerm) ||
      (purchase.serial && purchase.serial.toLowerCase().includes(searchLower)) ||
      (purchase.number && purchase.number.toString().includes(searchTerm))
    )
  })

  const handleCancelPurchase = async (purchaseId: string) => {
    const reason = prompt('Motivo de anulación:')
    if (!reason) return
    
    try {
      const { cancelOperation } = await graphqlRequest(CANCEL_PURCHASE_MUTATION, {
        operationId: purchaseId,
        reason
      })
      
      if (cancelOperation.success) {
        alert('Compra anulada exitosamente')
        loadPurchases()
      } else {
        alert(`Error: ${cancelOperation.message}`)
      }
    } catch (error) {
      console.error('Error anulando compra:', error)
      alert('Error al anular la compra')
    }
  }

  const handleViewPDF = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId)
    setShowPDFModal(true)
  }

  const navigateDate = (days: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  // const getTodayDate = () => new Date().toISOString().split('T')[0]
    // Función para obtener la fecha de hoy correctamente
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`
  const formatTime = (time: string) => time?.substring(0, 5) || ''

  // Paginación
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex)

  const generatePageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7
    const halfRange = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfRange)
    let endPage = Math.min(totalPages, currentPage + halfRange)

    if (currentPage <= halfRange) endPage = Math.min(totalPages, maxPagesToShow)
    if (currentPage + halfRange >= totalPages) startPage = Math.max(1, totalPages - maxPagesToShow + 1)

    for (let i = startPage; i <= endPage; i++) pages.push(i)
    return pages
  }

  // Función para obtener información del proveedor de forma segura
  const getSupplierInfo = (person: Purchase['person']) => {
    if (!person) {
      return {
        name: 'Proveedor no especificado',
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

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Lista de Compras</h1>
              <p className="text-xs text-slate-300 leading-tight">Gestiona tus compras realizadas</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/purchase')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-4 py-2.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Total Compras</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight">{stats.totalPurchases}</p>
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
                <p className="text-xs font-medium text-slate-600 tracking-tight">Items Comprados</p>
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

      {/* Controles */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
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

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por proveedor, documento, serie..."
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
                onClick={loadPurchases}
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

      {/* Tabla */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 h-full flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Cargando compras...</p>
              </div>
            </div>
          ) : currentPurchases.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-500 mb-1">No hay compras registradas</p>
                <p className="text-slate-400 text-xs mb-3">
                  {searchTerm ? 'No se encontraron compras con ese criterio' : 'Registra tu primera compra del día'}
                </p>
                <button
                  onClick={() => navigate('/purchases/new')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-1.5 mx-auto text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primera Compra</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 overflow-hidden rounded-t-lg">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Documento
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Proveedor
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
                          Acciones
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="min-w-full">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPurchases.map((purchase, index) => {
                        const supplierInfo = getSupplierInfo(purchase.person)
                        
                        return (
                          <tr 
                            key={purchase.id} 
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
                                  <p className="font-semibold text-slate-900 tracking-tight text-xs">
                                    {purchase.serial || 'S/N'}-{purchase.number || 'S/N'}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono">{purchase.currency}</p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-3 py-2">
                              <div className="max-w-xs">
                                <p className={`font-medium tracking-tight text-xs leading-tight truncate ${
                                  purchase.person ? 'text-slate-900' : 'text-slate-500 italic'
                                }`}>
                                  {supplierInfo.name}
                                </p>
                                <p className="text-xs text-slate-500 font-mono truncate">
                                  {supplierInfo.type}: {supplierInfo.document}
                                </p>
                              </div>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-xs space-y-0.5">
                                <p className="font-medium text-slate-900">
                                  {new Date(purchase.emitDate).toLocaleDateString('es-PE')}
                                </p>
                                <p className="text-slate-500 font-mono">
                                  {formatTime(purchase.emitTime)}
                                </p>
                              </div>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-right hidden lg:table-cell">
                              <span className="font-semibold text-slate-900 font-mono text-xs">
                                {formatCurrency(purchase.totalTaxable)}
                              </span>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-right hidden lg:table-cell">
                              <span className="font-medium text-slate-600 font-mono text-xs">
                                {formatCurrency(purchase.igvAmount)}
                              </span>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-right">
                              <span className="font-bold text-sm text-blue-600 font-mono">
                                {formatCurrency(purchase.totalAmount)}
                              </span>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-center hidden md:table-cell">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[purchase.operationStatus] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'}`}>
                                {STATUS_LABELS[purchase.operationStatus] || 'Desconocido'}
                              </span>
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleViewPDF(purchase.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver PDF"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleViewPDF(purchase.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Imprimir"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                {purchase.operationStatus !== '3' && (
                                  <button
                                    onClick={() => handleCancelPurchase(purchase.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Anular"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {searchTerm ? (
                          <>
                            {filteredPurchases.length > 0 ? (
                              `Encontrados: ${filteredPurchases.length} de ${purchases.length} | Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredPurchases.length)}`
                            ) : (
                              `No se encontraron resultados para "${searchTerm}"`
                            )}
                          </>
                        ) : (
                          `Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredPurchases.length)} de ${filteredPurchases.length} compras`
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
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Primera página"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
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
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

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

      <PDFViewerModal 
        isOpen={showPDFModal}
        onClose={() => {
          setShowPDFModal(false)
          setSelectedPurchaseId(null)
        }}
        saleId={selectedPurchaseId}
      />
    </div>
  )
}