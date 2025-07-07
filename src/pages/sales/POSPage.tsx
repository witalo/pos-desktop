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
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// TIPOS E INTERFACES
// =============================================
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

// =============================================
// QUERIES GRAPHQL
// =============================================
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

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function POSPage() {
  const navigate = useNavigate()
  const { company, user } = useAuthStore()
  const igvPercent = company?.igvPercentage || 18
  const igvFactor = 1 + (igvPercent / 100)

  // =============================================
  // ESTADOS
  // =============================================
  
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
  
  // =============================================
  // REFERENCIAS
  // =============================================
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

  // =============================================
  // EFECTOS
  // =============================================
  
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
        discountInputRef.current?.select()
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

  // =============================================
  // FUNCIONES DE CARGA DE DATOS
  // =============================================
  
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

  // =============================================
  // FUNCIONES DE CÁLCULO
  // =============================================
  
  // Calcular precio sin IGV desde precio con IGV
  const calculateUnitValue = (unitPrice: number): number => {
    return Number((unitPrice / igvFactor).toFixed(6))
  }

  // Actualizar totales de un item
  const updateCartItemTotals = (items: CartItem[], index: number) => {
    const item = items[index]
    
    // Calcular totales según tipo de afectación
    const affectationCode = item.product.typeAffectation.code
    
    if (affectationCode === '10') { // Gravado - Operación Onerosa
      // El precio unitario ya incluye IGV
      item.totalAmount = item.unitPrice * item.quantity // Total con IGV
      item.unitValue = calculateUnitValue(item.unitPrice) // Precio sin IGV
      item.totalValue = item.unitValue * item.quantity // Subtotal sin IGV
      item.totalIgv = item.totalAmount - item.totalValue // IGV
    } else {
      // Para otros tipos de afectación (exonerado, inafecto, gratuito)
      item.totalAmount = item.unitPrice * item.quantity
      item.unitValue = item.unitPrice
      item.totalValue = item.totalAmount
      item.totalIgv = 0
    }
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

  // =============================================
  // FUNCIONES DE BÚSQUEDA
  // =============================================
  
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

  // Buscar por código de barras - CORREGIDO
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
        // Usar callback para asegurar que trabajamos con el estado más actual
        setCartItems(prevItems => {
          const existingIndex = prevItems.findIndex(item => item.product.id === searchProducts[0].id)
          
          if (existingIndex >= 0) {
            // Actualizar cantidad del item existente
            // const newItems = [...prevItems]
            // newItems[existingIndex].quantity += 1
            // updateCartItemTotals(newItems, existingIndex)
            // return newItems
            // Actualizar cantidad del item existente CREANDO UN NUEVO OBJETO
            const newItems = prevItems.map((item, index) => {
              if (index === existingIndex) {
                const updatedItem = {
                  ...item,
                  quantity: item.quantity + 1
                }
                updateCartItemTotals([updatedItem], 0) // Actualizar totales para el item actualizado
                return updatedItem
              }
              return item
            })
            return newItems
          } else {
            // Agregar nuevo item
            const newItem: CartItem = {
              product: searchProducts[0],
              quantity: 1,
              unitPrice: searchProducts[0].unitPrice,
              unitValue: calculateUnitValue(searchProducts[0].unitPrice),
              totalValue: 0,
              totalIgv: 0,
              totalAmount: 0
            }
            
            const newItems = [...prevItems, newItem]
            updateCartItemTotals(newItems, newItems.length - 1)
            return newItems
          }
        })
        
        setBarcodeSearch('')
        barcodeRef.current?.focus()
      }
    } catch (error) {
      console.error('Error buscando por código de barras:', error)
    } finally {
      setSearchingProducts(false)
    }
  }, [company?.id, igvFactor])

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

  // =============================================
  // FUNCIONES DE MANEJO DE DATOS
  // =============================================
  
  // Seleccionar cliente
  const selectCustomer = (person: Person) => {
    setCustomer(person)
    setCustomerSearch(person.fullName)
    setShowCustomerResults(false)
    setCustomerResults([])
    // Enfocar en búsqueda de productos
    productSearchRef.current?.focus()
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
      updateCartItemTotals(newItems, newItems.length - 1)
      setCartItems(newItems)
    }
    
    setShowProductDialog(false)
    setEditingProduct(null)
    productSearchRef.current?.focus()
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

  // =============================================
  // FUNCIONES DE GUARDADO
  // =============================================
  
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

  // Calcular totales
  const totals = calculateTotals()

  // =============================================
  // RENDERIZADO
  // =============================================
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Punto de Venta</h1>
              <p className="text-xs text-blue-200">{company?.name || 'Mi Empresa'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-right">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-blue-200">Vendedor</p>
            </div>
            <div className="h-8 w-px bg-blue-400"></div>
            <div className="text-right">
              <p className="font-medium">{new Date().toLocaleDateString('es-PE')}</p>
              <p className="text-xs text-blue-200 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col p-3">
          
          {/* Controles Superiores Mejorados */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
            <div className="flex items-center space-x-4">
              {/* Documento y Serie */}
              <div className="flex items-center space-x-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Documento</label>
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
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Serie</label>
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
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fecha</label>
                <input
                  ref={dateRef}
                  type="date"
                  value={emissionDate}
                  onChange={(e) => setEmissionDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Cliente Mejorado */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Cliente (F2)</label>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
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
                          setTimeout(() => setShowCustomerResults(false), 200)
                        }}
                        placeholder="RUC/DNI o nombre..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <User className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                      
                      {searchingCustomer && (
                        <Loader2 className="absolute right-2 top-2 w-4 h-4 text-gray-400 animate-spin" />
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
                  
                  {/* Resultados de clientes - Mejorado */}
                  {showCustomerResults && customerResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {customerResults.map((person, index) => (
                        <div
                          key={person.document}
                          onClick={() => selectCustomer(person)}
                          className={`px-3 py-2 cursor-pointer transition-colors ${
                            index === selectedCustomerIndex 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-sm">{person.fullName}</div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            <span className="font-medium">{person.personType === '6' ? 'RUC' : 'DNI'}:</span>
                            <span>{person.document}</span>
                            {person.address && (
                              <>
                                <span>•</span>
                                <span className="truncate">{person.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cliente seleccionado */}
                  {customer && (
                    <div className="absolute -bottom-6 left-0 text-xs text-green-600 flex items-center bg-green-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="font-medium">{customer.fullName}</span>
                      <span className="mx-1">•</span>
                      <span>{customer.document}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Búsqueda de Productos - Mejorada */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
            <div className="grid grid-cols-5 gap-3">
              {/* Código de Barras - Destacado */}
              <div className="col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Scanner (B)</label>
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
                    placeholder="Código QR"
                    className="w-full pl-8 pr-2 py-1.5 text-sm border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50 font-mono"
                  />
                  <Barcode className="absolute left-2 top-2 w-4 h-4 text-red-500" />
                  {searchingProducts && barcodeSearch && (
                    <Loader2 className="absolute right-2 top-2 w-3 h-3 text-red-500 animate-spin" />
                  )}
                </div>
              </div>

              {/* Búsqueda Manual */}
              <div className="col-span-4">
                <label className="text-xs text-gray-500 block mb-1">Buscar Producto (F1)</label>
                <div className="relative">
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
                    placeholder="Nombre o código del producto..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                  
                  {searchingProducts && productSearch && (
                    <Loader2 className="absolute right-2 top-2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  
                  {/* Resultados de productos - Mejorados */}
                  {showProductResults && productResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                      {productResults.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => selectProduct(product)}
                          className={`px-3 py-3 cursor-pointer transition-colors ${
                            index === selectedProductIndex 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{product.description}</div>
                              <div className="text-xs text-gray-500 flex items-center space-x-3 mt-1">
                                <span className="flex items-center">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {product.code}
                                </span>
                                <span className="flex items-center">
                                  <Package className="w-3 h-3 mr-1" />
                                  Stock: {product.stock}
                                </span>
                                <span className="text-blue-600">{product.typeAffectation.name}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-lg text-blue-600">S/ {product.unitPrice.toFixed(2)}</div>
                              <div className="text-xs text-gray-500">c/IGV</div>
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

          {/* Tabla de Items - Mejorada */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">P. Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">IGV</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="bg-gray-100 rounded-full p-4 mb-4">
                            <Package className="w-16 h-16 text-gray-300" />
                          </div>
                          <p className="text-lg font-medium">No hay productos agregados</p>
                          <p className="text-sm mt-2 text-gray-400">Escanee un código QR o busque productos</p>
                          <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold">B</kbd>
                              <span className="ml-2">Escanear</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold">F1</kbd>
                              <span className="ml-2">Buscar</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              updateItemQuantity(index, value)
                            }}
                            onFocus={(e) => e.target.select()}
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
                            <p className="font-medium text-sm text-gray-900">{item.product.description}</p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <span className="flex items-center">
                                <Hash className="w-3 h-3 mr-1" />
                                {item.product.code}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="text-blue-600">{item.product.typeAffectation.name}</span>
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          S/ {(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          S/ {(item.totalValue || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          S/ {(item.totalIgv || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-sm">S/ {(item.totalAmount || 0).toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {cartItems.length > 0 && (
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-sm">
                        Totales:
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sm">
                        S/ {cartItems.reduce((acc, item) => acc + item.totalValue, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sm">
                        S/ {cartItems.reduce((acc, item) => acc + item.totalIgv, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sm text-blue-600">
                        S/ {cartItems.reduce((acc, item) => acc + item.totalAmount, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral - Resumen Mejorado */}
        <div className="w-80 bg-white shadow-lg flex flex-col">
          {/* Descuento */}
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 flex items-center">
              <Percent className="w-4 h-4 mr-2" />
              Descuento Global (F3)
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => setDiscountType('amount')}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  discountType === 'amount'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                S/ Monto
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  discountType === 'percent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveOperation()
                }
              }}
              placeholder={discountType === 'amount' ? '0.00' : '0'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Totales */}
          <div className="flex-1 p-4 space-y-3 text-sm">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Resumen de Venta
            </h3>
            
            {/* Subtotal */}
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">S/ {(totals.subtotal || 0).toFixed(2)}</span>
            </div>

            {/* Tipos de operación */}
            <div className="space-y-1">
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
            </div>

            {/* IGV */}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-600">IGV ({igvPercent}%):</span>
              <span className="font-medium">S/ {(totals.totalIgv || 0).toFixed(2)}</span>
            </div>

            {/* Descuento */}
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 bg-red-50 px-2 py-1 rounded">
                <span className="font-medium">Descuento:</span>
                <span className="font-medium">- S/ {(totals.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between pt-4 border-t-2 border-gray-200 text-xl font-bold">
              <span>TOTAL:</span>
              <span className="text-blue-600">S/ {(totals.totalAmount || 0).toFixed(2)}</span>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex items-center">
                  <span className="font-medium">Items:</span>
                  <span className="ml-2">{cartItems.length}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Unidades:</span>
                  <span className="ml-2">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
              </div>
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
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
                  Procesar Venta (F12)
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (cartItems.length > 0 && confirm('¿Está seguro de cancelar la venta actual?')) {
                  setCartItems([])
                  setCustomer(null)
                  setCustomerSearch('')
                  setGlobalDiscount(0)
                  barcodeRef.current?.focus()
                }
              }}
              className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Cancelar Venta
            </button>
          </div>

          {/* Atajos */}
          <div className="p-3 bg-gray-50 text-xs text-gray-600 space-y-1 border-t">
            <div className="font-semibold mb-2 text-gray-700">Atajos de Teclado:</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">B</kbd>
                <span className="ml-2">Scanner</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">F1</kbd>
                <span className="ml-2">Productos</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">F2</kbd>
                <span className="ml-2">Cliente</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">F3</kbd>
                <span className="ml-2">Descuento</span>
              </div>
              <div className="col-span-2 flex items-center mt-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">F12</kbd>
                <span className="ml-2">Procesar Venta</span>
              </div>
              <div className="col-span-2 flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">ESC</kbd>
                <span className="ml-2">Cerrar listas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Producto - Mejorado */}
      {showProductDialog && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-semibold">Agregar Producto</h3>
             <button
               onClick={() => {
                 setShowProductDialog(false)
                 setEditingProduct(null)
                 productSearchRef.current?.focus()
               }}
               className="text-gray-400 hover:text-gray-600 transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
           
           <div className="mb-4 p-3 bg-gray-50 rounded-md">
             <p className="font-medium text-gray-900">{editingProduct.product.description}</p>
             <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
               <span className="flex items-center">
                 <Hash className="w-3 h-3 mr-1" />
                 {editingProduct.product.code}
               </span>
               <span className="flex items-center">
                 <Package className="w-3 h-3 mr-1" />
                 Stock: {editingProduct.product.stock}
               </span>
             </div>
             <p className="text-sm text-blue-600 mt-1">
               {editingProduct.product.typeAffectation.name}
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
                 onFocus={(e) => e.target.select()}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault()
                     priceDialogRef.current?.select()
                   }
                 }}
                 min={1}
                 max={editingProduct.product.stock}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Precio con IGV
               </label>
               <div className="relative">
                 <span className="absolute left-3 top-2 text-gray-500">S/</span>
                 <input
                   ref={priceDialogRef}
                   type="number"
                   value={editingProduct.unitPrice}
                   onChange={(e) => setEditingProduct({
                     ...editingProduct,
                     unitPrice: Math.max(0, parseFloat(e.target.value) || 0)
                   })}
                   onFocus={(e) => e.target.select()}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault()
                       addProductFromDialog()
                     }
                   }}
                   step="0.01"
                   className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
             </div>
             
             <div className="bg-blue-50 p-3 rounded-lg space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Precio sin IGV:</span>
                 <span className="font-medium">S/ {calculateUnitValue(editingProduct.unitPrice).toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">IGV ({igvPercent}%):</span>
                 <span className="font-medium">S/ {(editingProduct.unitPrice - calculateUnitValue(editingProduct.unitPrice)).toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-base font-bold pt-2 border-t border-blue-100">
                 <span>Total:</span>
                 <span className="text-blue-600">S/ {(editingProduct.quantity * editingProduct.unitPrice).toFixed(2)}</span>
               </div>
             </div>
             
             <div className="flex justify-end space-x-2 pt-4">
               <button
                 onClick={() => {
                   setShowProductDialog(false)
                   setEditingProduct(null)
                   productSearchRef.current?.focus()
                 }}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
               >
                 Cancelar (ESC)
               </button>
               <button
                 onClick={addProductFromDialog}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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