// src/pages/sales/POSPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Trash2, 
  ShoppingCart,
  User,
  Package,
  Percent,
  DollarSign,
  AlertCircle,
  X,
  Barcode,
  FileText,
  Loader2,
  Calculator,
  Hash,
  CreditCard,
  Clock,
  ArrowRight
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
}

interface Product {
  id: string
  code: string
  description: string
  unitPrice: number
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
    }
  }
`

const CREATE_OPERATION_MUTATION = `
  mutation CreateOperation(
    $documentId: ID
    $serialId: ID
    $operationType: String!
    $operationDate: String!
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
  
  // Estado de procesamiento
  const [processing, setProcessing] = useState(false)
  
  // Referencias para navegación
  const documentRef = useRef<HTMLSelectElement>(null)
  const serialRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const customerSearchRef = useRef<HTMLInputElement>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const quantityDialogRef = useRef<HTMLInputElement>(null)
  const priceDialogRef = useRef<HTMLInputElement>(null)

  // Timer para ocultar resultados
  const hideResultsTimer = useRef<NodeJS.Timeout>()

  // Cargar documentos al iniciar
  useEffect(() => {
    loadDocuments()
    // Enfocar código de barras al cargar
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [company?.id])

  // Cargar seriales cuando cambia el documento
  useEffect(() => {
    if (selectedDocument) {
      loadSerials(selectedDocument.id)
    }
  }, [selectedDocument])

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
    console.log("igvFactor", igvFactor)
    return Number((unitPrice / igvFactor).toFixed(6))
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
        totalValue: 0,
        totalIgv: 0,
        totalAmount: 0
      }
      
      const newItems = [...cartItems, newItem]
      updateCartItemTotals(newItems, newItems.length - 1)
      setCartItems(newItems)
    }
  }

  // Actualizar totales de un item
  const updateCartItemTotals = (items: CartItem[], index: number) => {
    const item = items[index]
    const subtotal = item.unitValue * item.quantity
    item.totalValue = subtotal
    
    // Calcular IGV según tipo de afectación
    const affectationCode = item.product.typeAffectation.code
    if (affectationCode === '10') { // Gravado - Operación Onerosa
      item.totalIgv = item.totalValue * (igvPercent / 100)
      item.totalAmount = item.totalValue + item.totalIgv
    } else {
      item.totalIgv = 0
      item.totalAmount = item.totalValue
    }
  }

  // Actualizar cantidad de item
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return
    
    const newItems = [...cartItems]
    newItems[index].quantity = newQuantity
    updateCartItemTotals(newItems, index)
    setCartItems(newItems)
  }

  // Eliminar item del carrito
  const removeItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  // Seleccionar cliente
  const selectCustomer = (person: Person) => {
    setCustomer(person)
    setCustomerSearch(person.fullName)
    setShowCustomerResults(false)
    setCustomerResults([])
    // Enfocar en búsqueda de productos
    productSearchRef.current?.focus()
  }

  // Buscar persona por documento (botón buscar)
  const searchPersonByDocument = async () => {
    if (!customerSearch || customerSearch.length < 3) return
    
    setSearchingCustomer(true)
    try {
      const { searchPerson } = await graphqlRequest(`
        query SearchPerson($document: String!) {
          searchPerson(document: $document) {
            document
            fullName
            personType
            address
            email
            phone
          }
        }
      `, { document: customerSearch })
      
      if (searchPerson && searchPerson.length > 0) {
        selectCustomer(searchPerson[0])
      } else {
        alert('Cliente no encontrado')
      }
    } catch (error) {
      console.error('Error buscando cliente:', error)
      alert('Error al buscar cliente')
    } finally {
      setSearchingCustomer(false)
    }
  }

  // Seleccionar producto
  const selectProduct = (product: Product) => {
    setEditingProduct({
      product,
      quantity: 1,
      unitPrice: product.unitPrice
    })
    setShowProductDialog(true)
    setProductSearch('')
    setShowProductResults(false)
    setProductResults([])
    // Enfocar en cantidad del diálogo
    setTimeout(() => quantityDialogRef.current?.select(), 100)
  }

  // Agregar/actualizar producto desde diálogo
  const addProductFromDialog = () => {
    if (!editingProduct) return

    const existingIndex = cartItems.findIndex(item => item.product.id === editingProduct.product.id)
    
    if (existingIndex >= 0) {
      // Actualizar item existente
      const newItems = [...cartItems]
      newItems[existingIndex].quantity = editingProduct.quantity
      newItems[existingIndex].unitPrice = editingProduct.unitPrice
      newItems[existingIndex].unitValue = calculateUnitValue(editingProduct.unitPrice)
      updateCartItemTotals(newItems, existingIndex)
      setCartItems(newItems)
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        product: editingProduct.product,
        quantity: editingProduct.quantity,
        unitPrice: editingProduct.unitPrice,
        unitValue: calculateUnitValue(editingProduct.unitPrice),
        totalValue: 0,
        totalIgv: 0,
        totalAmount: 0
      }
      
      const newItems = [...cartItems, newItem]
      console.log("Valor agregado", newItems)
      updateCartItemTotals(newItems, newItems.length - 1)
      setCartItems(newItems)
    }
    
    setShowProductDialog(false)
    setEditingProduct(null)
    productSearchRef.current?.focus()
  }

  // Calcular totales generales
  const calculateTotals = () => {
    let subtotal = 0
    let totalTaxable = 0
    let totalExempt = 0
    let totalUnaffected = 0
    let totalFree = 0
    let totalIgv = 0

    cartItems.forEach(item => {
      const affectationCode = item.product.typeAffectation.code
      
      switch(affectationCode) {
        case '10': // Gravado - Operación Onerosa
          totalTaxable += item.totalValue
          totalIgv += item.totalIgv
          break
        case '20': // Exonerado - Operación Onerosa
          totalExempt += item.totalValue
          break
        case '30': // Inafecto - Operación Onerosa
          totalUnaffected += item.totalValue
          break
        case '40': // Gratuito
          totalFree += item.totalValue
          break
      }
      
      subtotal += item.totalAmount
    })

    // Calcular descuento
    let discountAmount = 0
    if (globalDiscount > 0) {
      if (discountType === 'percent') {
        discountAmount = subtotal * (globalDiscount / 100)
      } else {
        discountAmount = globalDiscount
      }
    }

    const totalAmount = subtotal - discountAmount

    return {
      subtotal,
      totalTaxable,
      totalExempt,
      totalUnaffected,
      totalFree,
      totalIgv,
      discountAmount,
      totalAmount
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
          discountPercentage: 0,
          typeAffectationId: parseInt(item.product.typeAffectation.code)
        }))
      }

      const response = await graphqlRequest(CREATE_OPERATION_MUTATION, operationData)
      
      if (response.createOperation.success) {
        const operation = response.createOperation.operation
        alert(`Venta ${operation.serial}-${operation.number} guardada exitosamente`)
        
        // Limpiar todo
        setCartItems([])
        setCustomer(null)
        setCustomerSearch('')
        setGlobalDiscount(0)
        setProductSearch('')
        setBarcodeSearch('')
        
        // Volver a enfocar código de barras
        barcodeRef.current?.focus()
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

  // Navegación con teclado global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // B - Enfocar código de barras
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'SELECT') {
          e.preventDefault()
          barcodeRef.current?.focus()
        }
      }
      // F1 - Buscar producto
      else if (e.key === 'F1') {
        e.preventDefault()
        productSearchRef.current?.focus()
      }
      // F2 - Buscar cliente
      else if (e.key === 'F2') {
        e.preventDefault()
        customerSearchRef.current?.focus()
      }
      // F3 - Enfocar descuento
      else if (e.key === 'F3') {
        e.preventDefault()
        discountInputRef.current?.focus()
      }
      // F12 - Procesar venta
      else if (e.key === 'F12') {
        e.preventDefault()
        saveOperation()
      }
      // Escape - Cerrar listas de búsqueda
      else if (e.key === 'Escape') {
        setShowCustomerResults(false)
        setShowProductResults(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartItems, customer])

  // Navegación en listas de búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCustomerResults && customerResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedCustomerIndex(prev => 
            prev < customerResults.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedCustomerIndex(prev => 
            prev > 0 ? prev - 1 : customerResults.length - 1
          )
        } else if (e.key === 'Enter') {
          e.preventDefault()
          selectCustomer(customerResults[selectedCustomerIndex])
        }
      } else if (showProductResults && productResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedProductIndex(prev => 
            prev < productResults.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedProductIndex(prev => 
            prev > 0 ? prev - 1 : productResults.length - 1
          )
        } else if (e.key === 'Enter') {
          e.preventDefault()
          selectProduct(productResults[selectedProductIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCustomerResults, showProductResults, customerResults, productResults, 
      selectedCustomerIndex, selectedProductIndex])

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ShoppingCart className="w-6 h-6" />
            <h1 className="text-xl font-bold">Punto de Venta</h1>
            <span className="text-blue-200">|</span>
            <span className="text-sm">{company?.name || 'Mi Empresa'}</span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span>{user?.firstName} {user?.lastName}</span>
            <span>|</span>
            <span>{new Date().toLocaleDateString('es-PE')}</span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col p-3">
          {/* Controles Superiores */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center space-x-4">
              {/* Documento y Serie */}
              <div className="flex items-center space-x-2">
                <select
                  ref={documentRef}
                  value={selectedDocument?.id || ''}
                  onChange={(e) => {
                    const doc = documents.find(d => d.id === e.target.value)
                    setSelectedDocument(doc || null)
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.description}</option>
                  ))}
                </select>
                
                <select
                  ref={serialRef}
                  value={selectedSerial?.id || ''}
                  onChange={(e) => {
                    const serial = serials.find(s => s.id === e.target.value)
                    setSelectedSerial(serial || null)
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {serials.map(serial => (
                    <option key={serial.id} value={serial.id}>{serial.serial}</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <input
                ref={dateRef}
                type="date"
                value={emissionDate}
                onChange={(e) => setEmissionDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Cliente */}
              <div className="flex-1 flex items-center space-x-2">
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      ref={customerSearchRef}
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        searchCustomersAdvanced(e.target.value)
                      }}
                      onFocus={() => {
                        if (customerResults.length > 0) {
                          setShowCustomerResults(true)
                        }
                      }}
                      onBlur={() => {
                        // Dar tiempo para el click
                        setTimeout(() => setShowCustomerResults(false), 200)
                      }}
                      placeholder="Cliente (F2): RUC/DNI o nombre..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <User className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    
                    {searchingCustomer && (
                      <Loader2 className="absolute right-2 top-2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    
                    {/* Resultados de clientes */}
                    {showCustomerResults && customerResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {customerResults.map((person, index) => (
                          <div
                            key={person.document}
                            onClick={() => selectCustomer(person)}
                            className={`px-3 py-2 cursor-pointer ${
                              index === selectedCustomerIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-sm">{person.fullName}</div>
                            <div className="text-xs text-gray-500">
                              {person.personType === '6' ? 'RUC' : 'DNI'}: {person.document}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {customer && (
                    <div className="absolute -bottom-6 left-0 text-xs text-blue-600 flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      {customer.fullName} - {customer.document}
                    </div>
                  )}
                </div>
                
                {/* Botón buscar */}
                <button
                  onClick={searchPersonByDocument}
                  disabled={searchingCustomer || !customerSearch}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Buscar por documento exacto"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Búsqueda de Productos */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center space-x-3">
              {/* Código de Barras */}
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
                  placeholder="Código (B)"
                  className="w-32 pl-8 pr-2 py-1.5 text-sm border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
                />
                <Barcode className="absolute left-2 top-2 w-4 h-4 text-red-500" />
              </div>

              {/* Búsqueda Manual */}
              <div className="flex-1 relative">
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    searchProducts(e.target.value)
                  }}
                  onFocus={() => {
                    if (productResults.length > 0) {
                      setShowProductResults(true)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowProductResults(false), 200)
                  }}
                  placeholder="Buscar producto (F1): nombre o código..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                
                {searchingProducts && (
                  <Loader2 className="absolute right-2 top-2 w-4 h-4 text-gray-400 animate-spin" />
                )}
                
                {/* Resultados de productos */}
                {showProductResults && productResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                    {productResults.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className={`px-3 py-2 cursor-pointer ${
                          index === selectedProductIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{product.description}</div>
                            <div className="text-xs text-gray-500">
                              Código: {product.code} | Stock: {product.stock}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">S/ {product.unitPrice.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{product.typeAffectation.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Items - Simplificada */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Cant.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Descripción</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">P. Unit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg">No hay productos agregados</p>
                        <p className="text-sm mt-1">Presione B para escanear o F1 para buscar</p>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              updateItemQuantity(index, value)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                productSearchRef.current?.focus()
                              }
                            }}
                            className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{item.product.description}</p>
                            <p className="text-xs text-gray-500">
                              {item.product.code} - {item.product.typeAffectation.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          S/ {(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-medium text-sm">S/ {(item.totalAmount || 0).toFixed(2)}</p>
                          {item.totalIgv > 0 && (
                            <p className="text-xs text-gray-500">IGV: {(item.totalIgv || 0).toFixed(2)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        <div className="w-80 bg-white shadow-lg flex flex-col">
          {/* Descuento */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Descuento Global</h3>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => setDiscountType('amount')}
                className={`flex-1 py-1.5 text-xs rounded ${
                  discountType === 'amount'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                S/ Monto
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 text-xs rounded ${
                  discountType === 'percent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                % Porcentaje
              </button>
            </div>
            <input
              ref={discountInputRef}
              type="number"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveOperation()
                }
              }}
              placeholder={discountType === 'amount' ? '0.00' : '0'}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Totales */}
          <div className="flex-1 p-4 space-y-2 text-sm">
            <h3 className="font-semibold mb-3 text-gray-700">Resumen</h3>
            
            {/* Subtotal */}
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>S/ {(totals.subtotal || 0).toFixed(2)}</span>
            </div>

            {/* Tipos de operación */}
            {totals.totalTaxable > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Op. Gravada:</span>
                <span className="text-gray-600">S/ {(totals.totalTaxable || 0).toFixed(2)}</span>
              </div>
            )}
            {totals.totalExempt > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Op. Exonerada:</span>
                <span className="text-gray-600">S/ {(totals.totalExempt || 0).toFixed(2)}</span>
              </div>
            )}
            {totals.totalUnaffected > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Op. Inafecta:</span>
                <span className="text-gray-600">S/ {(totals.totalUnaffected || 0).toFixed(2)}</span>
              </div>
            )}
            {totals.totalFree > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Op. Gratuita:</span>
                <span className="text-gray-600">S/ {(totals.totalFree || 0).toFixed(2)}</span>
              </div>
            )}

            {/* IGV */}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">IGV ({igvPercent}%):</span>
              <span>S/ {(totals.totalIgv || 0).toFixed(2)}</span>
            </div>

            {/* Descuento */}
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento:</span>
                <span>- S/ {(totals.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between pt-3 border-t text-lg font-bold">
              <span>TOTAL:</span>
              <span className="text-blue-600">S/ {(totals.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="p-4 border-t space-y-2">
            <button
              onClick={saveOperation}
              disabled={processing || cartItems.length === 0 || !customer}
              className={`w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center ${
                processing || cartItems.length === 0 || !customer
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Procesar (F12)
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (cartItems.length > 0 && confirm('¿Cancelar la venta actual?')) {
                  setCartItems([])
                  setCustomer(null)
                  setCustomerSearch('')
                  setGlobalDiscount(0)
                  barcodeRef.current?.focus()
                }
              }}
              className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancelar Venta
            </button>
          </div>

          {/* Atajos */}
          <div className="p-3 bg-gray-50 text-xs text-gray-600 space-y-1 border-t">
            <div className="font-semibold mb-1">Atajos:</div>
            <div className="grid grid-cols-2 gap-x-2">
              <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">B</kbd> Scanner</div>
              <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F1</kbd> Productos</div>
              <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F2</kbd> Cliente</div>
              <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F3</kbd> Descuento</div>
              <div className="col-span-2"><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F12</kbd> Procesar Venta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Producto */}
      {showProductDialog && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Agregar Producto</h3>
            
            <div className="mb-4">
              <p className="font-medium">{editingProduct.product.description}</p>
              <p className="text-sm text-gray-600">
                Código: {editingProduct.product.code} | Stock: {editingProduct.product.stock}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {editingProduct.product.typeAffectation.description}
              </p>
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
                      addProductFromDialog()
                    }
                  }}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Precio sin IGV: S/ {calculateUnitValue(editingProduct.unitPrice).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Total: S/ {(editingProduct.quantity * editingProduct.unitPrice).toFixed(2)}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowProductDialog(false)
                    setEditingProduct(null)
                    productSearchRef.current?.focus()
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button
                  onClick={addProductFromDialog}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}