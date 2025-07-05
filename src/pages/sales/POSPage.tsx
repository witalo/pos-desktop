// src/pages/sales/POSPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart,
  Calendar,
  User,
  Package,
  Percent,
  DollarSign,
  AlertCircle,
  Check,
  X,
  Barcode,
  FileText,
  ChevronDown,
  Loader2,
  Calculator,
  Edit2,
  Minus,
  UserPlus,
  Hash,
  Receipt,
  Keyboard,
  CreditCard,
  Clock
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// Tipos
interface Document {
  id: string
  code: string
  description: string
}

interface Serial {
  id: string
  serial: string
  documentId: string
}

interface Person {
  id?: string
  document: string
  fullName: string
  personType: string
  address?: string
  email?: string
  phone?: string
  isCustomer?: boolean
  isSupplier?: boolean
}

interface Product {
  id: string
  code: string
  description: string
  unitPrice: number
  unitValue?: number
  stock: number
  typeAffectation: {
    code: string
    name: string
  }
  unit: {
    id: string
    description: string
  }
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  unitValue: number
  discount: number
  discountPercentage: number
  totalValue: number
  totalIgv: number
  totalAmount: number
}

// Queries GraphQL
const GET_DOCUMENTS_QUERY = `
  query GetDocuments($companyId: ID!) {
    documents(companyId: $companyId) {
      id
      code
      description
    }
  }
`

const GET_SERIALS_QUERY = `
  query GetSerials($documentId: ID!) {
    serialsByDocument(documentId: $documentId) {
      id
      serial
    }
  }
`

const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($search: String!, $companyId: ID!, $limit: Int) {
    searchProducts(search: $search, companyId: $companyId, limit: $limit) {
      id
      code
      description
      unitPrice
      stock
      typeAffectation {
        code
        name
      }
      unit {
        id
        description
      }
    }
  }
`

const SEARCH_PERSONS_ADVANCED_QUERY = `
  query SearchPersonsAdvanced($search: String!, $limit: Int) {
    searchPersonsAdvanced(search: $search, limit: $limit) {
      id
      document
      fullName
      personType
      address
      phone
      email
      isCustomer
      isSupplier
    }
  }
`

const CREATE_OPERATION_MUTATION = `
  mutation CreateOperation(
    $documentId: ID
    $serialId: ID
    $operationType: String!
    $operationDate: String!
    $serial: String
    $number: Int
    $emitDate: String!
    $emitTime: String!
    $personId: ID
    $userId: ID!
    $companyId: ID!
    $currency: String
    $globalDiscountPercent: Float
    $globalDiscount: Float
    $totalDiscount: Float
    $igvPercent: Float
    $igvAmount: Float!
    $totalTaxable: Float
    $totalUnaffected: Float
    $totalExempt: Float
    $totalFree: Float
    $totalAmount: Float!
    $items: [OperationDetailInput]!
  ) {
    createOperation(
      documentId: $documentId
      serialId: $serialId
      operationType: $operationType
      operationDate: $operationDate
      serial: $serial
      number: $number
      emitDate: $emitDate
      emitTime: $emitTime
      personId: $personId
      userId: $userId
      companyId: $companyId
      currency: $currency
      globalDiscountPercent: $globalDiscountPercent
      globalDiscount: $globalDiscount
      totalDiscount: $totalDiscount
      igvPercent: $igvPercent
      igvAmount: $igvAmount
      totalTaxable: $totalTaxable
      totalUnaffected: $totalUnaffected
      totalExempt: $totalExempt
      totalFree: $totalFree
      totalAmount: $totalAmount
      items: $items
    ) {
      success
      message
      operation {
        id
        serial
        number
      }
    }
  }
`

export default function POSPage() {
  const navigate = useNavigate()
  const { company, user } = useAuthStore()
  const igvPercent = company?.igvPercentage || 18
  const igvFactor = 1 + (igvPercent / 100)

  // Estados principales
  const [documents, setDocuments] = useState<Document[]>([])
  const [serials, setSerials] = useState<Serial[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedSerial, setSelectedSerial] = useState<Serial | null>(null)
  const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0])
  
  // Cliente
  const [customer, setCustomer] = useState<Person | null>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Person[]>([])
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0)
  
  // Productos
  const [productSearch, setProductSearch] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [productResults, setProductResults] = useState<Product[]>([])
  const [showProductResults, setShowProductResults] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{
    product: Product
    quantity: number
    unitPrice: number
  } | null>(null)
  
  // Carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  
  // Estado de procesamiento
  const [processing, setProcessing] = useState(false)
  
  // Referencias para navegación
  const documentRef = useRef<HTMLSelectElement>(null)
  const serialRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const customerSearchRef = useRef<HTMLInputElement>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const quantityDialogRef = useRef<HTMLInputElement>(null)
  const priceDialogRef = useRef<HTMLInputElement>(null)

  // Cargar documentos al iniciar
  useEffect(() => {
    loadDocuments()
  }, [company?.id])

  // Cargar seriales cuando cambia el documento
  useEffect(() => {
    if (selectedDocument) {
      loadSerials(selectedDocument.id)
    }
  }, [selectedDocument])

  // Enfocar código de barras al cargar
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  // Cargar documentos
  const loadDocuments = async () => {
    if (!company?.id) return
    
    try {
      const { documents } = await graphqlRequest(GET_DOCUMENTS_QUERY, {
        companyId: company.id
      })
      setDocuments(documents || [])
      if (documents && documents.length > 0) {
        setSelectedDocument(documents[0])
      }
    } catch (error) {
      console.error('Error cargando documentos:', error)
    }
  }

  // Cargar series
  const loadSerials = async (documentId: string) => {
    try {
      const { serialsByDocument } = await graphqlRequest(GET_SERIALS_QUERY, {
        documentId
      })
      setSerials(serialsByDocument || [])
      if (serialsByDocument && serialsByDocument.length > 0) {
        setSelectedSerial(serialsByDocument[0])
      }
    } catch (error) {
      console.error('Error cargando series:', error)
    }
  }

  // Calcular precio sin IGV desde precio con IGV
  const calculateUnitValue = (unitPrice: number): number => {
    return Number((unitPrice / igvFactor).toFixed(6))
  }

  // Calcular precio con IGV desde precio sin IGV
  const calculateUnitPrice = (unitValue: number): number => {
    return Number((unitValue * igvFactor).toFixed(2))
  }

  // Búsqueda avanzada de clientes
  const searchCustomersAdvanced = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setCustomerResults([])
      setShowCustomerResults(false)
      return
    }

    setSearchingCustomer(true)
    try {
      const { searchPersonsAdvanced } = await graphqlRequest(SEARCH_PERSONS_ADVANCED_QUERY, {
        search,
        limit: 10
      })
      setCustomerResults(searchPersonsAdvanced || [])
      setShowCustomerResults(true)
      setSelectedCustomerIndex(0)
    } catch (error) {
      console.error('Error buscando clientes:', error)
    } finally {
      setSearchingCustomer(false)
    }
  }, [])

  // Buscar productos
  const searchProducts = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setProductResults([])
      setShowProductResults(false)
      return
    }

    setSearchingProducts(true)
    try {
      const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
        search,
        companyId: company?.id,
        limit: 20
      })
      setProductResults(searchProducts || [])
      setShowProductResults(true)
      setSelectedProductIndex(0)
    } catch (error) {
      console.error('Error buscando productos:', error)
    } finally {
      setSearchingProducts(false)
    }
  }, [company?.id])

  // Buscar por código de barras
  const searchByBarcode = useCallback(async (barcode: string) => {
    if (!barcode) return

    setSearchingProducts(true)
    try {
      const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
        search: barcode,
        companyId: company?.id,
        limit: 1
      })
      
      if (searchProducts && searchProducts.length > 0) {
        addToCartDirect(searchProducts[0])
        setBarcodeSearch('')
        barcodeRef.current?.focus()
      } else {
        // Sonido de error o notificación
        alert('Producto no encontrado')
      }
    } catch (error) {
      console.error('Error buscando por código de barras:', error)
    } finally {
      setSearchingProducts(false)
    }
  }, [company?.id])

  // Agregar al carrito directamente (código de barras)
  const addToCartDirect = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id)
    
    if (existingIndex >= 0) {
      const newItems = [...cartItems]
      newItems[existingIndex].quantity += 1
      updateCartItemTotals(newItems, existingIndex)
      setCartItems(newItems)
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPrice: product.unitPrice,
        unitValue: calculateUnitValue(product.unitPrice),
        discount: 0,
        discountPercentage: 0,
        totalValue: 0,
        totalIgv: 0,
        totalAmount: 0
      }
      
      const newItems = [...cartItems, newItem]
      updateCartItemTotals(newItems, newItems.length - 1)
      setCartItems(newItems)
    }
  }

  // Agregar al carrito con diálogo
  const addToCartWithDialog = () => {
    if (!editingProduct) return

    const existingIndex = cartItems.findIndex(item => item.product.id === editingProduct.product.id)
    if (existingIndex >= 0 && editingItemIndex === null) {
      alert('Este producto ya está en el carrito')
      return
    }

    const unitValue = calculateUnitValue(editingProduct.unitPrice)

    if (editingItemIndex !== null) {
      // Editando item existente
      const newItems = [...cartItems]
      newItems[editingItemIndex] = {
        ...newItems[editingItemIndex],
        quantity: editingProduct.quantity,
        unitPrice: editingProduct.unitPrice,
        unitValue: unitValue
      }
      updateCartItemTotals(newItems, editingItemIndex)
      setCartItems(newItems)
    } else {
      // Nuevo item
      const newItem: CartItem = {
        product: editingProduct.product,
        quantity: editingProduct.quantity,
        unitPrice: editingProduct.unitPrice,
        unitValue: unitValue,
        discount: 0,
        discountPercentage: 0,
        totalValue: 0,
        totalIgv: 0,
        totalAmount: 0
      }

      const newItems = [...cartItems, newItem]
      updateCartItemTotals(newItems, newItems.length - 1)
      setCartItems(newItems)
    }
    
    setShowProductDialog(false)
    setEditingProduct(null)
    setEditingItemIndex(null)
    setProductSearch('')
    productSearchRef.current?.focus()
  }

  // Actualizar totales de un item
  const updateCartItemTotals = (items: CartItem[], index: number) => {
    const item = items[index]
    const subtotal = item.unitValue * item.quantity
    item.totalValue = subtotal - item.discount
    
    // Calcular IGV según tipo de afectación
    const affectationCode = item.product.typeAffectation.code
    if (affectationCode === '10') { // Gravado
      item.totalIgv = item.totalValue * (igvPercent / 100)
    } else {
      item.totalIgv = 0
    }
    
    item.totalAmount = item.totalValue + item.totalIgv
  }

  // Actualizar cantidad de item
  const updateItemQuantity = (index: number, delta: number) => {
    const newItems = [...cartItems]
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta)
    updateCartItemTotals(newItems, index)
    setCartItems(newItems)
  }

  // Eliminar item del carrito
  const removeItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  // Editar item del carrito
  const editItem = (index: number) => {
    const item = cartItems[index]
    setEditingProduct({
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })
    setEditingItemIndex(index)
    setShowProductDialog(true)
  }

  // Calcular totales generales
  const calculateTotals = () => {
    let totalTaxable = 0
    let totalExempt = 0
    let totalUnaffected = 0
    let totalFree = 0
    let totalIgv = 0
    let totalAmount = 0

    cartItems.forEach(item => {
      const affectationCode = item.product.typeAffectation.code
      
      switch(affectationCode) {
        case '10': // Gravado
          totalTaxable += item.totalValue
          break
        case '20': // Exonerado
          totalExempt += item.totalValue
          break
        case '30': // Inafecto
          totalUnaffected += item.totalValue
          break
        case '40': // Gratuito
          totalFree += item.totalValue
          break
      }
      
      totalIgv += item.totalIgv
      totalAmount += item.totalAmount
    })

    // Aplicar descuento global
    let discountAmount = 0
    if (globalDiscount > 0) {
      if (discountType === 'percent') {
        discountAmount = totalAmount * (globalDiscount / 100)
      } else {
        discountAmount = globalDiscount
      }
      totalAmount -= discountAmount
    }

    return {
      totalTaxable,
      totalExempt,
      totalUnaffected,
      totalFree,
      totalIgv,
      totalAmount,
      discountAmount
    }
  }

  const totals = calculateTotals()

  // Guardar operación
  const saveOperation = async () => {
    if (!customer) {
      alert('Debe seleccionar un cliente')
      customerSearchRef.current?.focus()
      return
    }

    if (cartItems.length === 0) {
      alert('Debe agregar al menos un producto')
      barcodeRef.current?.focus()
      return
    }

    setProcessing(true)
    const currentTime = new Date()
    
    try {
      const operationData = {
        documentId: selectedDocument?.id,
        serialId: selectedSerial?.id,
        operationType: 'S',
        operationDate: emissionDate,
        emitDate: emissionDate,
        emitTime: currentTime.toTimeString().split(' ')[0],
        personId: customer.id,
        userId: user?.id,
        companyId: company?.id,
        currency: 'PEN',
        globalDiscountPercent: discountType === 'percent' ? globalDiscount : 0,
        globalDiscount: discountType === 'amount' ? globalDiscount : 0,
        totalDiscount: totals.discountAmount,
        igvPercent: igvPercent,
        igvAmount: totals.totalIgv,
        totalTaxable: totals.totalTaxable,
        totalUnaffected: totals.totalUnaffected,
        totalExempt: totals.totalExempt,
        totalFree: totals.totalFree,
        totalAmount: totals.totalAmount,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitValue: item.unitValue,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage,
          typeAffectationId: parseInt(item.product.typeAffectation.code)
        }))
      }

      const response = await graphqlRequest(CREATE_OPERATION_MUTATION, operationData)
      
      if (response.createOperation.success) {
        // Éxito - limpiar y preparar para siguiente venta
        const operation = response.createOperation.operation
        alert(`Venta ${operation.serial}-${operation.number} guardada exitosamente`)
        
        // Limpiar
        setCartItems([])
        setCustomer(null)
        setCustomerSearch('')
        setGlobalDiscount(0)
        setProductSearch('')
        setBarcodeSearch('')
        
        // Volver a enfocar código de barras
        barcodeRef.current?.focus()
        
        // TODO: Imprimir automáticamente
        // printReceipt(operation)
      } else {
        alert(`Error: ${response.createOperation.message}`)
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert('Error al procesar la venta')
    } finally {
      setProcessing(false)
    }
  }

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Buscar producto
      if (e.key === 'F1') {
        e.preventDefault()
        productSearchRef.current?.focus()
      }
      // F2 - Buscar cliente
      else if (e.key === 'F2') {
        e.preventDefault()
        customerSearchRef.current?.focus()
      }
      // F3 - Cambiar descuento
      else if (e.key === 'F3') {
        e.preventDefault()
        setDiscountType(prev => prev === 'amount' ? 'percent' : 'amount')
      }
      // F12 - Procesar venta
      else if (e.key === 'F12') {
        e.preventDefault()
        saveOperation()
      }
      // Escape - Cerrar diálogos
      else if (e.key === 'Escape') {
        setShowProductDialog(false)
        setShowCustomerResults(false)
        setShowProductResults(false)
      }
      // Navegación en resultados de búsqueda
      else if (e.key === 'ArrowDown') {
        if (showCustomerResults && customerResults.length > 0) {
          e.preventDefault()
          setSelectedCustomerIndex(prev => 
            prev < customerResults.length - 1 ? prev + 1 : 0
          )
        } else if (showProductResults && productResults.length > 0) {
          e.preventDefault()
          setSelectedProductIndex(prev => 
            prev < productResults.length - 1 ? prev + 1 : 0
          )
        }
      }
      else if (e.key === 'ArrowUp') {
        if (showCustomerResults && customerResults.length > 0) {
          e.preventDefault()
          setSelectedCustomerIndex(prev => 
            prev > 0 ? prev - 1 : customerResults.length - 1
          )
        } else if (showProductResults && productResults.length > 0) {
          e.preventDefault()
          setSelectedProductIndex(prev => 
            prev > 0 ? prev - 1 : productResults.length - 1
          )
        }
      }
      // Enter para seleccionar
      else if (e.key === 'Enter') {
        if (showCustomerResults && customerResults.length > 0) {
          e.preventDefault()
          const selected = customerResults[selectedCustomerIndex]
          setCustomer(selected)
          setCustomerSearch(selected.fullName)
          setShowCustomerResults(false)
          productSearchRef.current?.focus()
        } else if (showProductResults && productResults.length > 0) {
          e.preventDefault()
          const selected = productResults[selectedProductIndex]
          setEditingProduct({
            product: selected,
            quantity: 1,
            unitPrice: selected.unitPrice
          })
          setShowProductDialog(true)
          setTimeout(() => quantityDialogRef.current?.select(), 100)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCustomerResults, showProductResults, customerResults, productResults, 
      selectedCustomerIndex, selectedProductIndex, cartItems, customer])

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Punto de Venta</h1>
                <p className="text-blue-100 text-sm">{company?.name || 'Mi Empresa'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-blue-100">Usuario</p>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Fecha</p>
                <p className="font-medium">{new Date().toLocaleDateString('es-PE')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Hora</p>
                <p className="font-medium">
                  <Clock className="inline w-4 h-4 mr-1" />
                  {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col p-4">
          {/* Sección Superior: Documento y Cliente */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Documento */}
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Documento
                </label>
                <select
                  ref={documentRef}
                  value={selectedDocument?.id || ''}
                  onChange={(e) => {
                    const doc = documents.find(d => d.id === e.target.value)
                    setSelectedDocument(doc || null)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serie */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Serie
                </label>
                <select
                  ref={serialRef}
                  value={selectedSerial?.id || ''}
                  onChange={(e) => {
                    const serial = serials.find(s => s.id === e.target.value)
                    setSelectedSerial(serial || null)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {serials.map(serial => (
                    <option key={serial.id} value={serial.id}>
                      {serial.serial}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Emisión
                </label>
                <input
                  ref={dateRef}
                  type="date"
                  value={emissionDate}
                  onChange={(e) => setEmissionDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Cliente */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente (F2)
                </label>
                <div className="relative flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={customerSearchRef}
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        searchCustomersAdvanced(e.target.value)
                      }}
                      onFocus={() => customerResults.length > 0 && setShowCustomerResults(true)}
                      placeholder="Buscar por RUC, DNI o nombre..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    
                    {/* Resultados de búsqueda */}
                    {showCustomerResults && customerResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customerResults.map((person, index) => (
                          <div
                            key={person.id || person.document}
                            onClick={() => {
                              setCustomer(person)
                              setCustomerSearch(person.fullName)
                              setShowCustomerResults(false)
                            }}
                            className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                              index === selectedCustomerIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium text-sm">{person.fullName}</p>
                                <p className="text-xs text-gray-600">
                                  {person.personType === '6' ? 'RUC' : 'DNI'}: {person.document}
                                </p>
                              </div>
                              {person.address && (
                                <p className="text-xs text-gray-500 text-right">{person.address}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      // Abrir modal para crear cliente
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Nuevo Cliente"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                
                {customer && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{customer.fullName}</p>
                      <p className="text-xs text-gray-600">
                        {customer.personType === '6' ? 'RUC' : 'DNI'}: {customer.document}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCustomer(null)
                        setCustomerSearch('')
                      }}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Búsqueda de Productos */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Código de Barras */}
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Barcode className="inline w-4 h-4 mr-1" />
                  Código de Barras (Scanner)
                </label>
                <div className="relative">
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcodeSearch}
                    onChange={(e) => setBarcodeSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        searchByBarcode(barcodeSearch)
                      }
                    }}
                    placeholder="Escanear código..."
                    className="w-full pl-8 pr-3 py-2 text-sm border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
                  />
                  <Barcode className="absolute left-2 top-2.5 w-4 h-4 text-red-500" />
                </div>
              </div>

              {/* Búsqueda Manual */}
              <div className="col-span-8">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Package className="inline w-4 h-4 mr-1" />
                  Búsqueda de Productos (F1)
                </label>
                <div className="relative">
                  <input
                    ref={productSearchRef}
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      searchProducts(e.target.value)
                    }}
                    onFocus={() => productResults.length > 0 && setShowProductResults(true)}
                    placeholder="Buscar por nombre o código..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  
                  {/* Resultados de búsqueda */}
                  {showProductResults && productResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                      {productResults.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setEditingProduct({
                              product,
                              quantity: 1,
                              unitPrice: product.unitPrice
                            })
                            setShowProductDialog(true)
                            setTimeout(() => quantityDialogRef.current?.select(), 100)
                          }}
                          className={`px-3 py-3 cursor-pointer border-b last:border-b-0 ${
                            index === selectedProductIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                                <span>Código: {product.code}</span>
                                <span>Stock: {product.stock}</span>
                                <span className="text-green-600 font-medium">
                                  {product.typeAffectation.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-lg text-blue-600">S/ {product.unitPrice.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Inc. IGV</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Cantidad</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">P. Unit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Dscto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Subtotal</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">IGV</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-32 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No hay productos agregados</p>
                        <p className="text-sm mt-2">Escanee un código de barras o busque productos</p>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.product.code}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{item.product.description}</p>
                            <p className="text-xs text-gray-500">{item.product.typeAffectation.name}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => updateItemQuantity(index, -1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...cartItems]
                                newItems[index].quantity = Math.max(1, parseInt(e.target.value) || 1)
                                updateCartItemTotals(newItems, index)
                                setCartItems(newItems)
                              }}
                              className="w-16 text-center text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => updateItemQuantity(index, 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-900">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-900">
                          {item.discount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-900">
                          {item.totalValue.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-900">
                          {item.totalIgv.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                          {item.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => editItem(index)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral - Resumen */}
        <div className="w-96 bg-gray-50 p-4 flex flex-col">
          {/* Descuento Global */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Percent className="w-4 h-4 mr-2 text-gray-600" />
              Descuento Global
            </h3>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
                    discountType === 'amount'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Monto
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
                    discountType === 'percent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Percent className="w-4 h-4 inline mr-1" />
                  Porcentaje
                </button>
              </div>
              
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                placeholder={discountType === 'amount' ? '0.00' : '0'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-1">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-gray-600" />
              Resumen de Venta
            </h3>
            
            <div className="space-y-2 text-sm">
              {totals.totalTaxable > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Op. Gravada:</span>
                  <span className="font-medium">S/ {totals.totalTaxable.toFixed(2)}</span>
                </div>
              )}
              {totals.totalExempt > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Op. Exonerada:</span>
                  <span className="font-medium">S/ {totals.totalExempt.toFixed(2)}</span>
                </div>
              )}
              {totals.totalUnaffected > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Op. Inafecta:</span>
                  <span className="font-medium">S/ {totals.totalUnaffected.toFixed(2)}</span>
                </div>
              )}
              {totals.totalFree > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Op. Gratuita:</span>
                  <span className="font-medium">S/ {totals.totalFree.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">IGV ({igvPercent}%):</span>
                  <span className="font-medium">S/ {totals.totalIgv.toFixed(2)}</span>
                </div>
              </div>
              
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span className="font-medium">- S/ {totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">S/ {totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2">
            <button
              onClick={saveOperation}
              disabled={processing || cartItems.length === 0 || !customer}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Procesar Venta (F12)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (confirm('¿Está seguro de cancelar la venta actual?')) {
                  setCartItems([])
                  setCustomer(null)
                  setCustomerSearch('')
                  setGlobalDiscount(0)
                  barcodeRef.current?.focus()
                }
              }}
              className="w-full py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancelar Venta
            </button>
          </div>

          {/* Atajos de Teclado */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Keyboard className="w-4 h-4 mr-1" />
              Atajos Rápidos
            </h4>
            <div className="space-y-1 text-blue-700">
              <div className="flex justify-between">
                <span>Buscar Producto:</span>
                <kbd className="px-2 py-0.5 bg-blue-100 rounded">F1</kbd>
              </div>
              <div className="flex justify-between">
                <span>Buscar Cliente:</span>
                <kbd className="px-2 py-0.5 bg-blue-100 rounded">F2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Cambiar Descuento:</span>
                <kbd className="px-2 py-0.5 bg-blue-100 rounded">F3</kbd>
              </div>
              <div className="flex justify-between">
                <span>Procesar Venta:</span>
                <kbd className="px-2 py-0.5 bg-blue-100 rounded">F12</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Producto */}
      {showProductDialog && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingItemIndex !== null ? 'Editar Producto' : 'Agregar Producto'}
            </h3>
            
            <div className="mb-4">
              <p className="font-medium">{editingProduct.product.description}</p>
              <p className="text-sm text-gray-600">Código: {editingProduct.product.code}</p>
              <p className="text-sm text-gray-600">Stock disponible: {editingProduct.product.stock}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  ref={quantityDialogRef}
                  type="number"
                  value={editingProduct.quantity}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      priceDialogRef.current?.select()
                    }
                  }}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio con IGV
                </label>
                <input
                  ref={priceDialogRef}
                  type="number"
                  value={editingProduct.unitPrice}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    unitPrice: Math.max(0, parseFloat(e.target.value) || 0)
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToCartWithDialog()
                    }
                  }}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Precio sin IGV: S/ {calculateUnitValue(editingProduct.unitPrice).toFixed(2)}</p>
                <p className="text-sm text-gray-600">
                  Total: S/ {(editingProduct.quantity * editingProduct.unitPrice).toFixed(2)}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowProductDialog(false)
                    setEditingProduct(null)
                    setEditingItemIndex(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button
                  onClick={addToCartWithDialog}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItemIndex !== null ? 'Actualizar' : 'Agregar'} (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}