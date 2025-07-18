// src/pages/products/ProductListPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Image,
  DollarSign,
  Hash,
  BoxSelect,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// INTERFACES
// =============================================
interface Product {
  id: string
  code: string
  codeSnt?: string
  description: string
  unitValue: number
  unitPrice: number
  purchasePrice: number
  stock: number
  typeAffectation: {
    code: number
    name: string
  }
  unit: {
    id: string
    description: string
  }
  photoBase64?: string
  isActive: boolean
}

// =============================================
// QUERIES GRAPHQL
// =============================================
const GET_PRODUCTS_QUERY = `
  query GetProductsByCompany($companyId: ID!) {
    productsByCompanyId(companyId: $companyId) {
      id
      code
      codeSnt
      description
      unitValue
      unitPrice
      purchasePrice
      stock
      typeAffectation {
        code
        name
      }
      unit {
        id
        description
      }
      photoBase64
      isActive
    }
  }
`

const DELETE_PRODUCT_MUTATION = `
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      success
      message
      errors
    }
  }
`

export default function ProductListPage() {
  const navigate = useNavigate()
  const { company } = useAuthStore()
  
  // Estados
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Referencias
  const searchRef = useRef<HTMLInputElement>(null)
  
  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadProducts()
  }, [company?.id])
  
  useEffect(() => {
    searchRef.current?.focus()
  }, [])
  
  // =============================================
  // FUNCIONES
  // =============================================
  const loadProducts = async () => {
    if (!company?.id) return
    
    setLoading(true)
    try {
      const { productsByCompanyId } = await graphqlRequest(GET_PRODUCTS_QUERY, {
        companyId: company.id
      })
      
      setProducts(productsByCompanyId || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Está seguro de eliminar el producto "${productName}"?`)) return
    
    try {
      const { deleteProduct } = await graphqlRequest(DELETE_PRODUCT_MUTATION, {
        id: productId
      })
      
      if (deleteProduct.success) {
        alert('Producto eliminado exitosamente')
        loadProducts()
      } else {
        alert(`Error: ${deleteProduct.message}`)
      }
    } catch (error) {
      console.error('Error eliminando producto:', error)
      alert('Error al eliminar el producto')
    }
  }
  
  // Filtrado y búsqueda
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    
    // Filtro por búsqueda
    const matchesSearch = !searchTerm || 
      product.code.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      (product.codeSnt && product.codeSnt.toLowerCase().includes(searchLower)) ||
      product.unitPrice.toString().includes(searchTerm)
    
    // Filtro por categoría (tipo de afectación)
    const matchesCategory = selectedCategory === 'all' || 
      product.typeAffectation.code.toString() === selectedCategory
    
    return matchesSearch && matchesCategory && product.isActive
  })
  
  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)
  
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
  
  // Formato de moneda
  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`
  
  // Obtener categorías únicas
  const categories = Array.from(
    new Set(products.map(p => p.typeAffectation.code))
  ).map(code => {
    const product = products.find(p => p.typeAffectation.code === code)
    return {
      code: code.toString(),
      name: product?.typeAffectation.name || ''
    }
  })
  
  // =============================================
  // RENDERIZADO
  // =============================================
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Catálogo de Productos</h1>
              <p className="text-xs text-slate-300 leading-tight">Gestiona tu inventario de productos</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/product')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="px-4 py-2.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Total Productos</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight">{products.length}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Package className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Productos Activos</p>
                <p className="text-lg font-bold text-emerald-600 tracking-tight">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                <BoxSelect className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Stock Total</p>
                <p className="text-lg font-bold text-purple-600 tracking-tight">
                  {products.reduce((sum, p) => sum + p.stock, 0).toFixed(0)}
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 tracking-tight">Valor Inventario</p>
                <p className="text-lg font-bold text-orange-600 tracking-tight">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.unitPrice * p.stock), 0))}
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controles */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Filtro por categoría */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-700">Categoría:</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat.code} value={cat.code}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* Búsqueda */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por código, nombre o precio..."
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
                onClick={loadProducts}
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
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">Cargando productos...</p>
              </div>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-500 mb-1">No hay productos registrados</p>
                <p className="text-slate-400 text-xs mb-3">
                  {searchTerm ? 'No se encontraron productos con ese criterio' : 'Registra tu primer producto'}
                </p>
                <button
                  onClick={() => navigate('/product/new')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-1.5 mx-auto text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primer Producto</span>
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
                          Imagen
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Código
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Descripción
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
                          Unidad
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
                          Tipo Afect.
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white">
                          Stock
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white hidden lg:table-cell">
                          P. Compra
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-white">
                          P. Venta
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
                      {currentProducts.map((product, index) => (
                        <tr 
                          key={product.id}
                          className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                              {product.photoBase64 ? (
                                <img 
                                  src={product.photoBase64} 
                                  alt={product.description}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Image className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div>
                              <p className="font-semibold text-slate-900 tracking-tight text-xs">
                                {product.code}
                              </p>
                              {product.codeSnt && (
                                <p className="text-xs text-slate-500 font-mono">{product.codeSnt}</p>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900 text-xs truncate max-w-xs">
                              {product.description}
                            </p>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <span className="text-xs text-slate-600 font-medium">
                              {product.unit.description}
                            </span>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              product.typeAffectation.code === 10 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                : product.typeAffectation.code === 20
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                            }`}>
                              {product.typeAffectation.name}
                            </span>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            <span className={`font-semibold text-xs font-mono ${
                              product.stock <= 0 ? 'text-red-600' : 'text-slate-900'
                            }`}>
                              {product.stock.toFixed(2)}
                            </span>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-right hidden lg:table-cell">
                            <span className="text-xs font-mono text-slate-600">
                              {formatCurrency(product.purchasePrice)}
                            </span>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            <span className="font-bold text-sm text-blue-600 font-mono">
                              {formatCurrency(product.unitPrice)}
                            </span>
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.description)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-slate-600 font-medium">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} productos
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
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
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
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
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
    </div>
  )
}