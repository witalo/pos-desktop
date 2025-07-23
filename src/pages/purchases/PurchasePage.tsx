// src/pages/purchases/PurchasePage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrintService } from '../../services/printService'
import { 
  Search, 
  Trash2, 
  ShoppingBag,
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
  CheckCircle,
  Calendar,
  Save,
  ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'
import SuccessDialog from '../components/SuccessDialog'

// =============================================
// FUNCIONES DE FECHA Y HORA CORREGIDAS
// =============================================

/**
 * Obtiene la fecha local actual en formato YYYY-MM-DD
 */
const getLocalDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene la hora local actual en formato HH:MM:SS
 */
const getLocalTime = (): string => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Obtiene fecha y hora actual en formato ISO para base de datos
 */
const getCurrentDateTime = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a formato DateTime con hora actual
 */
const getDateTimeFromDate = (dateString: string): string => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${dateString} ${hours}:${minutes}:${seconds}`
}

/**
 * Formatea una fecha para mostrar en la interfaz
 */
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formatea una hora para mostrar en la interfaz
 */
const formatDisplayTime = (timeString: string): string => {
  if (timeString.includes(' ')) {
    const timePart = timeString.split(' ')[1]
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes}`
  } else {
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }
}

/**
 * Obtiene la zona horaria local
 */
const getLocalTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// =============================================
// INTERFACES
// =============================================
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

interface Payment {
  paymentType: 'CN' | 'CR'
  paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
  status: 'P' | 'C'
  notes?: string
  paymentDate: string
  paidAmount: number
}

// =============================================
// QUERIES GRAPHQL
// =============================================
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

const SEARCH_SUPPLIERS_QUERY = `
  query SearchSuppliers($search: String!, $limit: Int) {
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

const CREATE_PURCHASE_MUTATION = `
  mutation CreatePurchase(
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
    $payments: [PaymentInput]!
  ) {
    createOperation(
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
      payments: $payments
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
export default function PurchasePage() {
  const navigate = useNavigate()
  const { company, user } = useAuthStore()
  const igvPercent = company?.igvPercentage || 18
  const igvFactor = 1 + (igvPercent / 100)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // =============================================
  // ESTADOS
  // =============================================
  const [serie, setSerie] = useState('')
  const [numero, setNumero] = useState('')
  const [emissionDate, setEmissionDate] = useState(getLocalDate()) // ✅ Fecha exacta
  
  // Proveedor
  const [supplier, setSupplier] = useState<Person | null>(null)
  const [searchingSupplier, setSearchingSupplier] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierResults, setSupplierResults] = useState<Person[]>([])
  const [showSupplierResults, setShowSupplierResults] = useState(false)
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(0)
  
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

  // Estado para pagos
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentType, setPaymentType] = useState<'CN' | 'CR'>('CN')
  const [paymentMethod, setPaymentMethod] = useState<'E' | 'Y' | 'P' | 'T' | 'B'>('E')
  const [payments, setPayments] = useState<Payment[]>([])
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('')
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(-1)
  const [creditPaymentDate, setCreditPaymentDate] = useState(emissionDate)
  const [paymentNotes, setPaymentNotes] = useState('')
  
  // =============================================
  // REFERENCIAS
  // =============================================
  const serieRef = useRef<HTMLInputElement>(null)
  const numeroRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const supplierSearchRef = useRef<HTMLInputElement>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const quantityDialogRef = useRef<HTMLInputElement>(null)
  const priceDialogRef = useRef<HTMLInputElement>(null)
  const paymentAmountRef = useRef<HTMLInputElement>(null)
  const creditDateRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'SELECT') {
          e.preventDefault()
          barcodeRef.current?.focus()
        }
      }
      else if (e.key === 'F1') {
        e.preventDefault()
        productSearchRef.current?.focus()
      }
      else if (e.key === 'F2') {
        e.preventDefault()
        supplierSearchRef.current?.focus()
      }
      else if (e.key === 'F3') {
        e.preventDefault()
        discountInputRef.current?.select()
      }
      else if (e.key === 'F12') {
        e.preventDefault()
        saveOperation()
      }
      else if (e.key === 'Escape') {
        setShowSupplierResults(false)
        setShowProductResults(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartItems, supplier])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSupplierResults && supplierResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSupplierIndex(prev => 
            prev < supplierResults.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSupplierIndex(prev => 
            prev > 0 ? prev - 1 : supplierResults.length - 1
          )
        } else if (e.key === 'Enter') {
          e.preventDefault()
          selectSupplier(supplierResults[selectedSupplierIndex])
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
  }, [showSupplierResults, showProductResults, supplierResults, productResults, 
      selectedSupplierIndex, selectedProductIndex])

  // =============================================
  // FUNCIONES DE CÁLCULO
  // =============================================
  const calculateUnitValue = (unitPrice: number): number => {
    return Number((unitPrice / igvFactor).toFixed(6))
  }

  const calculateTotals = () => {
    let totalTaxable = 0
    let totalExempt = 0
    let totalUnaffected = 0
    let totalFree = 0
    let totalIgv = 0

    cartItems.forEach((item) => {
      const affectationCode = String(item.product.typeAffectation.code)
      
      if (affectationCode === '10') {
        totalTaxable += item.totalValue
        totalIgv += item.totalIgv
      } else if (affectationCode === '20') {
        totalExempt += item.totalValue
      } else if (affectationCode === '30') {
        totalUnaffected += item.totalValue
      } else if (affectationCode === '40') {
        totalFree += item.totalValue
      }
    })

    const subtotal = totalTaxable + totalExempt + totalUnaffected + totalFree
    const totalBeforeDiscount = subtotal + totalIgv

    let discountAmount = 0
    if (globalDiscount > 0) {
      if (discountType === 'percent') {
        discountAmount = totalBeforeDiscount * (globalDiscount / 100)
      } else {
        discountAmount = globalDiscount
      }
    }

    const totalAmount = totalBeforeDiscount - discountAmount

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
  const searchSuppliers = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setSupplierResults([])
      setShowSupplierResults(false)
      return
    }

    setSearchingSupplier(true)
    try {
      const { searchPersonsAdvanced } = await graphqlRequest(SEARCH_SUPPLIERS_QUERY, {
        search,
        limit: 10
      })
      setSupplierResults(searchPersonsAdvanced || [])
      setShowSupplierResults(true)
      setSelectedSupplierIndex(0)
    } catch (error) {
      console.error('Error buscando proveedores:', error)
    } finally {
      setSearchingSupplier(false)
    }
  }, [])

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
        const product = searchProducts[0]
        
        setCartItems(prevItems => {
          const existingIndex = prevItems.findIndex(item => item.product.id === product.id)
          
          if (existingIndex >= 0) {
            const newItems = [...prevItems]
            const newQuantity = newItems[existingIndex].quantity + 1
            
            const affectationCode = String(product.typeAffectation.code)
            let totalAmount, unitValue, totalValue, totalIgv
            
            if (affectationCode === '10') {
              totalAmount = product.unitPrice * newQuantity
              unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
              totalValue = Number((unitValue * newQuantity).toFixed(2))
              totalIgv = Number((totalAmount - totalValue).toFixed(2))
            } else {
              totalAmount = product.unitPrice * newQuantity
              unitValue = product.unitPrice
              totalValue = totalAmount
              totalIgv = 0
            }
            
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newQuantity,
              unitValue: unitValue,
              totalValue: totalValue,
              totalIgv: totalIgv,
              totalAmount: totalAmount
            }
            
            return newItems
          } else {
            const affectationCode = String(product.typeAffectation.code)
            let totalAmount, unitValue, totalValue, totalIgv
            
            if (affectationCode === '10') {
              totalAmount = product.unitPrice * 1
              unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
              totalValue = Number((unitValue * 1).toFixed(2))
              totalIgv = Number((totalAmount - totalValue).toFixed(2))
            } else {
              totalAmount = product.unitPrice * 1
              unitValue = product.unitPrice
              totalValue = totalAmount
              totalIgv = 0
            }
            
            const newItem: CartItem = {
              product: product,
              quantity: 1,
              unitPrice: product.unitPrice,
              unitValue: unitValue,
              totalValue: totalValue,
              totalIgv: totalIgv,
              totalAmount: totalAmount
            }
            
            return [...prevItems, newItem]
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

  const searchSupplierByDocument = async () => {
    if (!supplierSearch || supplierSearch.length < 3) return
    
    setSearchingSupplier(true)
    try {
      const { searchPerson } = await graphqlRequest(`
        query SearchPerson($document: String!) {
          searchPerson(document: $document) {
            document
            fullName
            personType
            address
            phone
            email
          }
        }
      `, { document: supplierSearch })
      
      if (searchPerson && searchPerson.length > 0) {
        selectSupplier(searchPerson[0])
      } else {
        alert('Proveedor no encontrado')
      }
    } catch (error) {
      console.error('Error buscando proveedor:', error)
      alert('Error al buscar proveedor')
    } finally {
      setSearchingSupplier(false)
    }
  }

  // =============================================
  // FUNCIONES DE MANEJO DE DATOS
  // =============================================
  const selectSupplier = (person: Person) => {
    setSupplier(person)
    setSupplierSearch(person.fullName)
    setShowSupplierResults(false)
    setSupplierResults([])
    productSearchRef.current?.focus()
  }

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
    setTimeout(() => quantityDialogRef.current?.select(), 100)
  }

  const addProductFromDialog = () => {
    if (!editingProduct) return

    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.product.id === editingProduct.product.id)
      const product = editingProduct.product
      const quantity = editingProduct.quantity
      const unitPrice = editingProduct.unitPrice
      
      const affectationCode = String(product.typeAffectation.code)
      let totalAmount, unitValue, totalValue, totalIgv
      
      if (affectationCode === '10') {
        totalAmount = unitPrice * quantity
        unitValue = Number((unitPrice / igvFactor).toFixed(6))
        totalValue = Number((unitValue * quantity).toFixed(2))
        totalIgv = Number((totalAmount - totalValue).toFixed(2))
      } else {
        totalAmount = unitPrice * quantity
        unitValue = unitPrice
        totalValue = totalAmount
        totalIgv = 0
      }
      
      if (existingIndex >= 0) {
        const newItems = [...prevItems]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: quantity,
          unitPrice: unitPrice,
          unitValue: unitValue,
          totalValue: totalValue,
          totalIgv: totalIgv,
          totalAmount: totalAmount
        }
        return newItems
      } else {
        const newItem: CartItem = {
          product: product,
          quantity: quantity,
          unitPrice: unitPrice,
          unitValue: unitValue,
          totalValue: totalValue,
          totalIgv: totalIgv,
          totalAmount: totalAmount
        }
        
        return [...prevItems, newItem]
      }
    })
    
    setShowProductDialog(false)
    setEditingProduct(null)
    productSearchRef.current?.focus()
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return
    
    setCartItems(prevItems => {
      const newItems = [...prevItems]
      const item = newItems[index]
      const product = item.product
      
      const affectationCode = String(product.typeAffectation.code)
      let totalAmount, unitValue, totalValue, totalIgv
      
      if (affectationCode === '10') {
        totalAmount = item.unitPrice * newQuantity
        unitValue = Number((item.unitPrice / igvFactor).toFixed(6))
        totalValue = Number((unitValue * newQuantity).toFixed(2))
        totalIgv = Number((totalAmount - totalValue).toFixed(2))
      } else {
        totalAmount = item.unitPrice * newQuantity
        unitValue = item.unitPrice
        totalValue = totalAmount
        totalIgv = 0
      }
      
      newItems[index] = {
        ...item,
        quantity: newQuantity,
        unitValue: unitValue,
        totalValue: totalValue,
        totalIgv: totalIgv,
        totalAmount: totalAmount
      }
      
      return newItems
    })
  }

  const removeItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  // =============================================
  // FUNCIONES DE GUARDADO
  // =============================================
  const saveOperation = async () => {
    if (cartItems.length === 0) {
      alert('Debe agregar al menos un producto')
      barcodeRef.current?.focus()
      return
    }

    if (company?.isPayment) {
      setShowPaymentDialog(true)
      setPayments([])
      setCurrentPaymentAmount(totals.totalAmount.toFixed(2))
      setPaymentType('CN')
      setPaymentMethod('E')
      setCreditPaymentDate(emissionDate)
      setPaymentNotes('')
      setTimeout(() => paymentAmountRef.current?.select(), 100)
    } else {
      processOperation([])
    }
  }

  const processOperation = async (paymentsList: Payment[]) => {
    setProcessing(true)
    
    try {
      const operationData = {
        operationType: 'E', // Entrada (Compra)
        operationDate: emissionDate,
        serial: serie || undefined,
        number: numero ? parseInt(numero) : undefined,
        emitDate: emissionDate,
        emitTime: getLocalTime(), // ✅ Hora exacta actual
        personId: supplier?.id,
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
        })),
        payments: paymentsList || []
      }
      
      const response = await graphqlRequest(CREATE_PURCHASE_MUTATION, operationData)
      
      if (response.createOperation.success) {
        const operation = response.createOperation.operation
        const successMsg = `Compra ${operation.serial}-${operation.number} guardada exitosamente`
        
        // Log para verificar datos de fecha y hora
        console.log('✅ Operación guardada con éxito:', {
          fecha: operationData.emitDate,
          hora: operationData.emitTime,
          fechaHoraCompleta: getCurrentDateTime(),
          zonaHoraria: getLocalTimeZone(),
          operacionId: operation.id
        })
        
        // Mostrar diálogo de éxito
        setSuccessMessage(successMsg)
        setShowSuccessDialog(true)
        
        // Redirigir después de cerrar el diálogo
        setTimeout(() => {
          setShowSuccessDialog(false)
          navigate('/purchases')
        }, 3000)
      } else {
        alert(`Error: ${response.createOperation.message}`)
      }
    } catch (error) {
      console.error('Error al guardar compra:', error)
      alert('Error al procesar la compra')
    } finally {
      setProcessing(false)
      setShowPaymentDialog(false)
    }
  }

  const addPayment = () => {
    const amount = parseFloat(currentPaymentAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    const remaining = totals.totalAmount - totalPaid

    if (amount > remaining + 0.01) {
      alert(`El monto excede el restante: S/ ${remaining.toFixed(2)}`)
      return
    }

    // ✅ Obtener fecha y hora exacta para el pago
    const paymentDateTime = paymentType === 'CR' 
      ? getDateTimeFromDate(creditPaymentDate)  // Fecha elegida + hora actual
      : getCurrentDateTime()                     // Fecha y hora actual

    const newPayment: Payment = {
      paymentType: paymentType,
      paymentMethod: paymentMethod,
      status: 'C',
      paymentDate: paymentDateTime, // ✅ Formato correcto YYYY-MM-DD HH:MM:SS
      paidAmount: amount,
      notes: paymentNotes || undefined
    }

    // Log para verificar datos del pago
    console.log('✅ Nuevo pago registrado:', {
      tipo: paymentType === 'CN' ? 'Contado' : 'Crédito',
      metodo: paymentMethod,
      fechaOriginal: paymentType === 'CR' ? creditPaymentDate : emissionDate,
      fechaHoraFinal: paymentDateTime,
      monto: amount,
      zona: getLocalTimeZone()
    })

    setPayments([...payments, newPayment])
    setPaymentNotes('')
    
    const newTotalPaid = totalPaid + amount
    const newRemaining = totals.totalAmount - newTotalPaid
    
    if (Math.abs(newRemaining) < 0.01) {
      setCurrentPaymentAmount('')
      setTimeout(() => {
        const confirmButton = document.getElementById('confirm-payment-button')
        confirmButton?.focus()
      }, 100)
    } else {
      setCurrentPaymentAmount(newRemaining.toFixed(2))
      setTimeout(() => {
        paymentAmountRef.current?.select()
      }, 100)
    }
  }

  const removePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index)
    setPayments(newPayments)
    
    const totalPaid = newPayments.reduce((sum, p) => sum + p.paidAmount, 0)
    const remaining = totals.totalAmount - totalPaid
    
    setCurrentPaymentAmount(remaining.toFixed(2))
    setTimeout(() => {
      paymentAmountRef.current?.select()
    }, 100)
  }

  const confirmPayments = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    
    if (Math.abs(totalPaid - totals.totalAmount) > 0.01) {
      alert(`El total pagado (S/ ${totalPaid.toFixed(2)}) no coincide con el total de la compra (S/ ${totals.totalAmount.toFixed(2)})`)
      return
    }

    processOperation(payments)
  }

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'E': 'Efectivo',
      'Y': 'Yape',
      'P': 'Plin',
      'T': 'Tarjeta',
      'B': 'Transferencia'
    }
    return methods[method] || method
  }

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'E': return '💵'
      case 'Y': return '📱'
      case 'P': return '📱'
      case 'T': return '💳'
      case 'B': return '🏦'
      default: return '💰'
    }
  }

  // Calcular totales
  const totals = calculateTotals()

 return (
    <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
      {/* Header con Fechas y Horas Corregidas */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/purchases')}
              className="bg-white/10 p-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Nueva Compra</h1>
              <p className="text-xs text-slate-300 leading-tight">{company?.denomination || 'Mi Empresa'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-right">
              <p className="font-semibold tracking-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-300">Usuario</p>
            </div>
            <div className="h-6 w-px bg-slate-400"></div>
            <div className="text-right">
              <p className="font-semibold tracking-tight">{formatDisplayDate(getLocalDate())}</p>
              <p className="text-xs text-slate-300 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDisplayTime(getLocalTime())} • {getLocalTimeZone().split('/')[1]}
              </p>
            </div>
          </div>
        </div>
      </div>
       {/* Diálogo de Producto */}
      {showProductDialog && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">Agregar Producto</h3>
              <button
                onClick={() => {
                  setShowProductDialog(false)
                  setEditingProduct(null)
                  productSearchRef.current?.focus()
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900 tracking-tight">{editingProduct.product.description}</p>
              <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                <span className="flex items-center font-mono">
                  <Hash className="w-3 h-3 mr-1" />
                  {editingProduct.product.code}
                </span>
                <span className="flex items-center">
                  <Package className="w-3 h-3 mr-1" />
                  Stock: {editingProduct.product.stock}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1 font-semibold">
                {editingProduct.product.typeAffectation.name}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 tracking-tight">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 tracking-tight">
                  Precio con IGV
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono">S/</span>
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
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg space-y-2 border border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Precio sin IGV:</span>
                  <span className="font-bold font-mono">S/ {calculateUnitValue(editingProduct.unitPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">IGV ({igvPercent}%):</span>
                  <span className="font-bold font-mono">S/ {(editingProduct.unitPrice - calculateUnitValue(editingProduct.unitPrice)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-purple-200">
                  <span className="tracking-tight">Total:</span>
                  <span className="text-purple-600 font-mono tracking-tight">S/ {(editingProduct.quantity * editingProduct.unitPrice).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowProductDialog(false)
                    setEditingProduct(null)
                    productSearchRef.current?.focus()
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-semibold tracking-tight"
                >
                  Cancelar (ESC)
                </button>
                <button
                  onClick={addProductFromDialog}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold tracking-tight"
                >
                  Agregar (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Pagos con Fechas y Horas Corregidas */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Registro de Pagos</h3>
              </div>
              <button
                onClick={() => {
                  setShowPaymentDialog(false)
                  setPayments([])
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de montos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-white/70 font-medium">Total Compra</p>
                  <p className="text-lg font-bold text-white font-mono">S/ {totals.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Pagado</p>
                  <p className="text-lg font-bold text-emerald-300 font-mono">
                    S/ {payments.reduce((sum, p) => sum + p.paidAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Restante</p>
                  <p className="text-lg font-bold text-yellow-300 font-mono">
                    S/ {(totals.totalAmount - payments.reduce((sum, p) => sum + p.paidAmount, 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              {/* Información de fecha y hora actual */}
              <div className="text-center mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-white/60 flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDisplayDate(getLocalDate())} • {formatDisplayTime(getLocalTime())} • {getLocalTimeZone().split('/')[1]}
                </p>
              </div>
            </div>

            {/* Tipo de pago */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPaymentType('CN')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    paymentType === 'CN'
                      ? 'bg-white text-purple-700 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Contado
                </button>
                <button
                  onClick={() => setPaymentType('CR')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    paymentType === 'CR'
                      ? 'bg-white text-purple-700 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Crédito
                </button>
              </div>
            </div>

            {/* Métodos de pago y fecha para crédito */}
            {paymentType === 'CN' ? (
              <div className="mb-4">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'E', name: 'Efectivo', icon: '💵' },
                    { id: 'Y', name: 'Yape', icon: '📱' },
                    { id: 'P', name: 'Plin', icon: '📱' },
                    { id: 'T', name: 'Tarjeta', icon: '💳' },
                    { id: 'B', name: 'Transfer', icon: '🏦' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`py-3 px-2 rounded-lg font-medium transition-all flex flex-col items-center space-y-1 ${
                        paymentMethod === method.id
                          ? 'bg-white text-purple-700 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-xs">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs text-white/70 font-medium mb-2">
                  Fecha de Pago
                  <span className="ml-2 text-white/50 text-xs">(+ {formatDisplayTime(getLocalTime())} automática)</span>
                </label>
                <div className="relative">
                  <input
                    ref={creditDateRef}
                    type="date"
                    value={creditPaymentDate}
                    onChange={(e) => setCreditPaymentDate(e.target.value)}
                    min={emissionDate}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-medium placeholder-white/40 focus:outline-none focus:border-white/60"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                </div>
                <p className="text-xs text-white/50 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Se registrará: {formatDisplayDate(creditPaymentDate)} a las {formatDisplayTime(getLocalTime())}
                </p>
              </div>
            )}

            {/* Monto a pagar */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-mono text-lg">S/</span>
                <input
                  ref={paymentAmountRef}
                  type="text"
                  inputMode="decimal"
                  value={currentPaymentAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    const parts = value.split('.')
                    if (parts.length > 2) return
                    if (parts[1] && parts[1].length > 2) return
                    setCurrentPaymentAmount(value)
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPayment()
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-10 pr-16 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white text-2xl font-mono placeholder-white/40 focus:outline-none focus:border-white/60 text-center"
                />
                <button
                  onClick={addPayment}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-lg flex items-center justify-center transition-colors shadow-lg"
                >
                  <span className="text-2xl font-bold">+</span>
                </button>
              </div>
              
              {/* Indicador de fecha y hora exacta */}
              <p className="text-xs text-white/50 flex items-center justify-center">
                <Clock className="w-3 h-3 mr-1" />
                {paymentType === 'CN' 
                  ? `Se registrará: ${formatDisplayDate(emissionDate)} a las ${formatDisplayTime(getLocalTime())}`
                  : `Se registrará: ${formatDisplayDate(creditPaymentDate)} a las ${formatDisplayTime(getLocalTime())}`
                }
              </p>
              
              {/* Campo de notas */}
              <div>
                <input
                  ref={notesRef}
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPayment()
                    }
                  }}
                  placeholder="Notas (opcional)"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {/* Lista de pagos */}
            {payments.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {payments.map((payment, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {getPaymentMethodName(payment.paymentMethod)} • {payment.paymentType === 'CN' ? 'Contado' : 'Crédito'}
                        </p>
                        <p className="text-white/70 text-xs">
                          📅 {formatDisplayDate(payment.paymentDate.split(' ')[0])} 
                          🕒 {formatDisplayTime(payment.paymentDate)}
                          {payment.notes && <span className="ml-2">• {payment.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold font-mono">S/ {payment.paidAmount.toFixed(2)}</span>
                      <button
                        onClick={() => removePayment(index)}
                        className="text-red-300 hover:text-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentDialog(false)
                  setPayments([])
                }}
                className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPayments}
                disabled={Math.abs(payments.reduce((sum, p) => sum + p.paidAmount, 0) - totals.totalAmount) > 0.01}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  Math.abs(payments.reduce((sum, p) => sum + p.paidAmount, 0) - totals.totalAmount) > 0.01
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Éxito */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false)
          navigate('/purchases')
        }}
        title="Operación Exitosa"
        message={successMessage}
        autoCloseDelay={3000}
      />
    </div>
  )
}
// // // src/pages/purchases/PurchasePage.tsx
// // import { useState, useEffect, useRef, useCallback } from 'react'
// // import { useNavigate } from 'react-router-dom'
// // import { PrintService } from '../../services/printService'
// // import { 
// //   Search, 
// //   Trash2, 
// //   ShoppingBag,
// //   User,
// //   Package,
// //   Percent,
// //   DollarSign,
// //   AlertCircle,
// //   X,
// //   Barcode,
// //   FileText,
// //   Loader2,
// //   Calculator,
// //   Hash,
// //   CreditCard,
// //   Clock,
// //   ArrowRight,
// //   CheckCircle,
// //   Calendar,
// //   Save,
// //   ArrowLeft
// // } from 'lucide-react'
// // import { useAuthStore } from '../../store/authStore'
// // import { graphqlRequest } from '../../services/graphql'

// // // =============================================
// // // TIPOS E INTERFACES
// // // =============================================
// // interface Person {
// //   id?: string
// //   document: string
// //   fullName: string
// //   personType: string
// //   address?: string
// //   email?: string
// //   phone?: string
// // }

// // interface Product {
// //   id: string
// //   code: string
// //   description: string
// //   unitPrice: number
// //   stock: number
// //   typeAffectation: {
// //     code: string
// //     name: string
// //   }
// //   unit: {
// //     id: string
// //     description: string
// //   }
// // }

// // interface CartItem {
// //   product: Product
// //   quantity: number
// //   unitPrice: number
// //   unitValue: number
// //   totalValue: number
// //   totalIgv: number
// //   totalAmount: number
// // }

// // interface Payment {
// //   paymentType: 'CN' | 'CR'
// //   paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
// //   status: 'P' | 'C'
// //   notes?: string
// //   paymentDate: string
// //   paidAmount: number
// // }

// // // =============================================
// // // QUERIES GRAPHQL
// // // =============================================
// // const SEARCH_PRODUCTS_QUERY = `
// //   query SearchProducts($search: String!, $companyId: ID!, $limit: Int) {
// //     searchProducts(search: $search, companyId: $companyId, limit: $limit) {
// //       id
// //       code
// //       description
// //       unitPrice
// //       stock
// //       typeAffectation {
// //         code
// //         name
// //       }
// //       unit {
// //         id
// //         description
// //       }
// //     }
// //   }
// // `

// // const SEARCH_SUPPLIERS_QUERY = `
// //   query SearchSuppliers($search: String!, $limit: Int) {
// //     searchPersonsAdvanced(search: $search, limit: $limit, isSupplier: true) {
// //       id
// //       document
// //       fullName
// //       personType
// //       address
// //       phone
// //       email
// //     }
// //   }
// // `

// // const CREATE_PURCHASE_MUTATION = `
// //   mutation CreatePurchase(
// //     $operationType: String!
// //     $operationDate: String!
// //     $serial: String
// //     $number: Int
// //     $emitDate: String!
// //     $emitTime: String!
// //     $personId: ID
// //     $userId: ID!
// //     $companyId: ID!
// //     $currency: String
// //     $globalDiscountPercent: Float
// //     $globalDiscount: Float
// //     $totalDiscount: Float
// //     $igvPercent: Float
// //     $igvAmount: Float!
// //     $totalTaxable: Float
// //     $totalUnaffected: Float
// //     $totalExempt: Float
// //     $totalFree: Float
// //     $totalAmount: Float!
// //     $items: [OperationDetailInput]!
// //     $payments: [PaymentInput]!
// //   ) {
// //     createOperation(
// //       operationType: $operationType
// //       operationDate: $operationDate
// //       serial: $serial
// //       number: $number
// //       emitDate: $emitDate
// //       emitTime: $emitTime
// //       personId: $personId
// //       userId: $userId
// //       companyId: $companyId
// //       currency: $currency
// //       globalDiscountPercent: $globalDiscountPercent
// //       globalDiscount: $globalDiscount
// //       totalDiscount: $totalDiscount
// //       igvPercent: $igvPercent
// //       igvAmount: $igvAmount
// //       totalTaxable: $totalTaxable
// //       totalUnaffected: $totalUnaffected
// //       totalExempt: $totalExempt
// //       totalFree: $totalFree
// //       totalAmount: $totalAmount
// //       items: $items
// //       payments: $payments
// //     ) {
// //       success
// //       message
// //       operation {
// //         id
// //         serial
// //         number
// //       }
// //     }
// //   }
// // `

// // // =============================================
// // // COMPONENTE PRINCIPAL
// // // =============================================
// // export default function PurchasePage() {
// //   const navigate = useNavigate()
// //   const { company, user } = useAuthStore()
// //   const igvPercent = company?.igvPercentage || 18
// //   const igvFactor = 1 + (igvPercent / 100)

// //   // =============================================
// //   // ESTADOS
// //   // =============================================
  
// //   // Estados principales
// //   const [serie, setSerie] = useState('')
// //   const [numero, setNumero] = useState('')
// //   const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0])
  
// //   // Proveedor
// //   const [supplier, setSupplier] = useState<Person | null>(null)
// //   const [searchingSupplier, setSearchingSupplier] = useState(false)
// //   const [supplierSearch, setSupplierSearch] = useState('')
// //   const [supplierResults, setSupplierResults] = useState<Person[]>([])
// //   const [showSupplierResults, setShowSupplierResults] = useState(false)
// //   const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(0)
  
// //   // Productos
// //   const [productSearch, setProductSearch] = useState('')
// //   const [barcodeSearch, setBarcodeSearch] = useState('')
// //   const [searchingProducts, setSearchingProducts] = useState(false)
// //   const [productResults, setProductResults] = useState<Product[]>([])
// //   const [showProductResults, setShowProductResults] = useState(false)
// //   const [selectedProductIndex, setSelectedProductIndex] = useState(0)
// //   const [showProductDialog, setShowProductDialog] = useState(false)
// //   const [editingProduct, setEditingProduct] = useState<{
// //     product: Product
// //     quantity: number
// //     unitPrice: number
// //   } | null>(null)
  
// //   // Carrito
// //   const [cartItems, setCartItems] = useState<CartItem[]>([])
// //   const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
// //   const [globalDiscount, setGlobalDiscount] = useState(0)
  
// //   // Estado de procesamiento
// //   const [processing, setProcessing] = useState(false)

// //   // Estado para pagos
// //   const [showPaymentDialog, setShowPaymentDialog] = useState(false)
// //   const [paymentType, setPaymentType] = useState<'CN' | 'CR'>('CN')
// //   const [paymentMethod, setPaymentMethod] = useState<'E' | 'Y' | 'P' | 'T' | 'B'>('E')
// //   const [payments, setPayments] = useState<Payment[]>([])
// //   const [currentPaymentAmount, setCurrentPaymentAmount] = useState('')
// //   const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(-1)
// //   const [creditPaymentDate, setCreditPaymentDate] = useState(emissionDate)
// //   const [paymentNotes, setPaymentNotes] = useState('')
  
// //   // =============================================
// //   // REFERENCIAS
// //   // =============================================
// //   const serieRef = useRef<HTMLInputElement>(null)
// //   const numeroRef = useRef<HTMLInputElement>(null)
// //   const dateRef = useRef<HTMLInputElement>(null)
// //   const supplierSearchRef = useRef<HTMLInputElement>(null)
// //   const productSearchRef = useRef<HTMLInputElement>(null)
// //   const barcodeRef = useRef<HTMLInputElement>(null)
// //   const discountInputRef = useRef<HTMLInputElement>(null)
// //   const quantityDialogRef = useRef<HTMLInputElement>(null)
// //   const priceDialogRef = useRef<HTMLInputElement>(null)
// //   const paymentAmountRef = useRef<HTMLInputElement>(null)
// //   const creditDateRef = useRef<HTMLInputElement>(null)
// //   const notesRef = useRef<HTMLInputElement>(null)

// //   // =============================================
// //   // EFECTOS
// //   // =============================================
  
// //   // Enfocar código de barras al cargar
// //   useEffect(() => {
// //     setTimeout(() => barcodeRef.current?.focus(), 100)
// //   }, [])

// //   // Navegación con teclado global
// //   useEffect(() => {
// //     const handleKeyDown = (e: KeyboardEvent) => {
// //       // B - Enfocar código de barras
// //       if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.altKey) {
// //         const activeElement = document.activeElement as HTMLElement
// //         if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'SELECT') {
// //           e.preventDefault()
// //           barcodeRef.current?.focus()
// //         }
// //       }
// //       // F1 - Buscar producto
// //       else if (e.key === 'F1') {
// //         e.preventDefault()
// //         productSearchRef.current?.focus()
// //       }
// //       // F2 - Buscar proveedor
// //       else if (e.key === 'F2') {
// //         e.preventDefault()
// //         supplierSearchRef.current?.focus()
// //       }
// //       // F3 - Enfocar descuento
// //       else if (e.key === 'F3') {
// //         e.preventDefault()
// //         discountInputRef.current?.select()
// //       }
// //       // F12 - Procesar compra
// //       else if (e.key === 'F12') {
// //         e.preventDefault()
// //         saveOperation()
// //       }
// //       // Escape - Cerrar listas de búsqueda
// //       else if (e.key === 'Escape') {
// //         setShowSupplierResults(false)
// //         setShowProductResults(false)
// //       }
// //     }

// //     window.addEventListener('keydown', handleKeyDown)
// //     return () => window.removeEventListener('keydown', handleKeyDown)
// //   }, [cartItems, supplier])

// //   // Navegación en listas de búsqueda
// //   useEffect(() => {
// //     const handleKeyDown = (e: KeyboardEvent) => {
// //       if (showSupplierResults && supplierResults.length > 0) {
// //         if (e.key === 'ArrowDown') {
// //           e.preventDefault()
// //           setSelectedSupplierIndex(prev => 
// //             prev < supplierResults.length - 1 ? prev + 1 : 0
// //           )
// //         } else if (e.key === 'ArrowUp') {
// //           e.preventDefault()
// //           setSelectedSupplierIndex(prev => 
// //             prev > 0 ? prev - 1 : supplierResults.length - 1
// //           )
// //         } else if (e.key === 'Enter') {
// //           e.preventDefault()
// //           selectSupplier(supplierResults[selectedSupplierIndex])
// //         }
// //       } else if (showProductResults && productResults.length > 0) {
// //         if (e.key === 'ArrowDown') {
// //           e.preventDefault()
// //           setSelectedProductIndex(prev => 
// //             prev < productResults.length - 1 ? prev + 1 : 0
// //           )
// //         } else if (e.key === 'ArrowUp') {
// //           e.preventDefault()
// //           setSelectedProductIndex(prev => 
// //             prev > 0 ? prev - 1 : productResults.length - 1
// //           )
// //         } else if (e.key === 'Enter') {
// //           e.preventDefault()
// //           selectProduct(productResults[selectedProductIndex])
// //         }
// //       }
// //     }

// //     window.addEventListener('keydown', handleKeyDown)
// //     return () => window.removeEventListener('keydown', handleKeyDown)
// //   }, [showSupplierResults, showProductResults, supplierResults, productResults, 
// //       selectedSupplierIndex, selectedProductIndex])

// //   // =============================================
// //   // FUNCIONES DE CÁLCULO
// //   // =============================================
  
// //   // Calcular precio sin IGV desde precio con IGV
// //   const calculateUnitValue = (unitPrice: number): number => {
// //     return Number((unitPrice / igvFactor).toFixed(6))
// //   }

// //   // Calcular totales generales
// //   const calculateTotals = () => {
// //     let totalTaxable = 0
// //     let totalExempt = 0
// //     let totalUnaffected = 0
// //     let totalFree = 0
// //     let totalIgv = 0

// //     cartItems.forEach((item) => {
// //       const affectationCode = String(item.product.typeAffectation.code)
      
// //       if (affectationCode === '10') {
// //         totalTaxable += item.totalValue
// //         totalIgv += item.totalIgv
// //       } else if (affectationCode === '20') {
// //         totalExempt += item.totalValue
// //       } else if (affectationCode === '30') {
// //         totalUnaffected += item.totalValue
// //       } else if (affectationCode === '40') {
// //         totalFree += item.totalValue
// //       }
// //     })

// //     const subtotal = totalTaxable + totalExempt + totalUnaffected + totalFree
// //     const totalBeforeDiscount = subtotal + totalIgv

// //     let discountAmount = 0
// //     if (globalDiscount > 0) {
// //       if (discountType === 'percent') {
// //         discountAmount = totalBeforeDiscount * (globalDiscount / 100)
// //       } else {
// //         discountAmount = globalDiscount
// //       }
// //     }

// //     const totalAmount = totalBeforeDiscount - discountAmount

// //     return {
// //       subtotal,
// //       totalTaxable,
// //       totalExempt,
// //       totalUnaffected,
// //       totalFree,
// //       totalIgv,
// //       discountAmount,
// //       totalAmount
// //     }
// //   }

// //   // =============================================
// //   // FUNCIONES DE BÚSQUEDA
// //   // =============================================
  
// //   // Búsqueda de proveedores
// //   const searchSuppliers = useCallback(async (search: string) => {
// //     if (!search || search.length < 2) {
// //       setSupplierResults([])
// //       setShowSupplierResults(false)
// //       return
// //     }

// //     setSearchingSupplier(true)
// //     try {
// //       const { searchPersonsAdvanced } = await graphqlRequest(SEARCH_SUPPLIERS_QUERY, {
// //         search,
// //         limit: 10
// //       })
// //       setSupplierResults(searchPersonsAdvanced || [])
// //       setShowSupplierResults(true)
// //       setSelectedSupplierIndex(0)
// //     } catch (error) {
// //       console.error('Error buscando proveedores:', error)
// //     } finally {
// //       setSearchingSupplier(false)
// //     }
// //   }, [])

// //   // Buscar productos
// //   const searchProducts = useCallback(async (search: string) => {
// //     if (!search || search.length < 2) {
// //       setProductResults([])
// //       setShowProductResults(false)
// //       return
// //     }

// //     setSearchingProducts(true)
// //     try {
// //       const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
// //         search,
// //         companyId: company?.id,
// //         limit: 20
// //       })
// //       setProductResults(searchProducts || [])
// //       setShowProductResults(true)
// //       setSelectedProductIndex(0)
// //     } catch (error) {
// //       console.error('Error buscando productos:', error)
// //     } finally {
// //       setSearchingProducts(false)
// //     }
// //   }, [company?.id])

// //   // Buscar por código de barras
// //   const searchByBarcode = useCallback(async (barcode: string) => {
// //     if (!barcode) return

// //     setSearchingProducts(true)
// //     try {
// //       const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
// //         search: barcode,
// //         companyId: company?.id,
// //         limit: 1
// //       })
      
// //       if (searchProducts && searchProducts.length > 0) {
// //         const product = searchProducts[0]
        
// //         setCartItems(prevItems => {
// //           const existingIndex = prevItems.findIndex(item => item.product.id === product.id)
          
// //           if (existingIndex >= 0) {
// //             const newItems = [...prevItems]
// //             const newQuantity = newItems[existingIndex].quantity + 1
            
// //             const affectationCode = String(product.typeAffectation.code)
// //             let totalAmount, unitValue, totalValue, totalIgv
            
// //             if (affectationCode === '10') {
// //               totalAmount = product.unitPrice * newQuantity
// //               unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
// //               totalValue = Number((unitValue * newQuantity).toFixed(2))
// //               totalIgv = Number((totalAmount - totalValue).toFixed(2))
// //             } else {
// //               totalAmount = product.unitPrice * newQuantity
// //               unitValue = product.unitPrice
// //               totalValue = totalAmount
// //               totalIgv = 0
// //             }
            
// //             newItems[existingIndex] = {
// //               ...newItems[existingIndex],
// //               quantity: newQuantity,
// //               unitValue: unitValue,
// //               totalValue: totalValue,
// //               totalIgv: totalIgv,
// //               totalAmount: totalAmount
// //             }
            
// //             return newItems
// //           } else {
// //             const affectationCode = String(product.typeAffectation.code)
// //             let totalAmount, unitValue, totalValue, totalIgv
            
// //             if (affectationCode === '10') {
// //               totalAmount = product.unitPrice * 1
// //               unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
// //               totalValue = Number((unitValue * 1).toFixed(2))
// //               totalIgv = Number((totalAmount - totalValue).toFixed(2))
// //             } else {
// //               totalAmount = product.unitPrice * 1
// //               unitValue = product.unitPrice
// //               totalValue = totalAmount
// //               totalIgv = 0
// //             }
            
// //             const newItem: CartItem = {
// //               product: product,
// //               quantity: 1,
// //               unitPrice: product.unitPrice,
// //               unitValue: unitValue,
// //               totalValue: totalValue,
// //               totalIgv: totalIgv,
// //               totalAmount: totalAmount
// //             }
            
// //             return [...prevItems, newItem]
// //           }
// //         })
        
// //         setBarcodeSearch('')
// //         barcodeRef.current?.focus()
// //       }
// //     } catch (error) {
// //       console.error('Error buscando por código de barras:', error)
// //     } finally {
// //       setSearchingProducts(false)
// //     }
// //   }, [company?.id, igvFactor])

// //   // Buscar proveedor por documento
// //   const searchSupplierByDocument = async () => {
// //     if (!supplierSearch || supplierSearch.length < 3) return
    
// //     setSearchingSupplier(true)
// //     try {
// //       const { searchPerson } = await graphqlRequest(`
// //         query SearchPerson($document: String!) {
// //           searchPerson(document: $document) {
// //             document
// //             fullName
// //             personType
// //             address
// //             email
// //             phone
// //           }
// //         }
// //       `, { document: supplierSearch })
      
// //       if (searchPerson && searchPerson.length > 0) {
// //         selectSupplier(searchPerson[0])
// //       } else {
// //         alert('Proveedor no encontrado')
// //       }
// //     } catch (error) {
// //       console.error('Error buscando proveedor:', error)
// //       alert('Error al buscar proveedor')
// //     } finally {
// //       setSearchingSupplier(false)
// //     }
// //   }

// //   // =============================================
// //   // FUNCIONES DE MANEJO DE DATOS
// //   // =============================================
  
// //   // Seleccionar proveedor
// //   const selectSupplier = (person: Person) => {
// //     setSupplier(person)
// //     setSupplierSearch(person.fullName)
// //     setShowSupplierResults(false)
// //     setSupplierResults([])
// //     productSearchRef.current?.focus()
// //   }

// //   // Seleccionar producto
// //   const selectProduct = (product: Product) => {
// //     setEditingProduct({
// //       product,
// //       quantity: 1,
// //       unitPrice: product.unitPrice
// //     })
// //     setShowProductDialog(true)
// //     setProductSearch('')
// //     setShowProductResults(false)
// //     setProductResults([])
// //     setTimeout(() => quantityDialogRef.current?.select(), 100)
// //   }

// //   // Agregar/actualizar producto desde diálogo
// //   const addProductFromDialog = () => {
// //     if (!editingProduct) return

// //     setCartItems(prevItems => {
// //       const existingIndex = prevItems.findIndex(item => item.product.id === editingProduct.product.id)
// //       const product = editingProduct.product
// //       const quantity = editingProduct.quantity
// //       const unitPrice = editingProduct.unitPrice
      
// //       const affectationCode = String(product.typeAffectation.code)
// //       let totalAmount, unitValue, totalValue, totalIgv
      
// //       if (affectationCode === '10') {
// //         totalAmount = unitPrice * quantity
// //         unitValue = Number((unitPrice / igvFactor).toFixed(6))
// //         totalValue = Number((unitValue * quantity).toFixed(2))
// //         totalIgv = Number((totalAmount - totalValue).toFixed(2))
// //       } else {
// //         totalAmount = unitPrice * quantity
// //         unitValue = unitPrice
// //         totalValue = totalAmount
// //         totalIgv = 0
// //       }
      
// //       if (existingIndex >= 0) {
// //         const newItems = [...prevItems]
// //         newItems[existingIndex] = {
// //           ...newItems[existingIndex],
// //           quantity: quantity,
// //           unitPrice: unitPrice,
// //           unitValue: unitValue,
// //           totalValue: totalValue,
// //           totalIgv: totalIgv,
// //           totalAmount: totalAmount
// //         }
// //         return newItems
// //       } else {
// //         const newItem: CartItem = {
// //           product: product,
// //           quantity: quantity,
// //           unitPrice: unitPrice,
// //           unitValue: unitValue,
// //           totalValue: totalValue,
// //           totalIgv: totalIgv,
// //           totalAmount: totalAmount
// //         }
        
// //         return [...prevItems, newItem]
// //       }
// //     })
    
// //     setShowProductDialog(false)
// //     setEditingProduct(null)
// //     productSearchRef.current?.focus()
// //   }

// //   // Actualizar cantidad de item
// //   const updateItemQuantity = (index: number, newQuantity: number) => {
// //     if (newQuantity <= 0) return
    
// //     setCartItems(prevItems => {
// //       const newItems = [...prevItems]
// //       const item = newItems[index]
// //       const product = item.product
      
// //       const affectationCode = String(product.typeAffectation.code)
// //       let totalAmount, unitValue, totalValue, totalIgv
      
// //       if (affectationCode === '10') {
// //         totalAmount = item.unitPrice * newQuantity
// //         unitValue = Number((item.unitPrice / igvFactor).toFixed(6))
// //         totalValue = Number((unitValue * newQuantity).toFixed(2))
// //         totalIgv = Number((totalAmount - totalValue).toFixed(2))
// //       } else {
// //         totalAmount = item.unitPrice * newQuantity
// //         unitValue = item.unitPrice
// //         totalValue = totalAmount
// //         totalIgv = 0
// //       }
      
// //       newItems[index] = {
// //         ...item,
// //         quantity: newQuantity,
// //         unitValue: unitValue,
// //         totalValue: totalValue,
// //         totalIgv: totalIgv,
// //         totalAmount: totalAmount
// //       }
      
// //       return newItems
// //     })
// //   }

// //   // Eliminar item del carrito
// //   const removeItem = (index: number) => {
// //     setCartItems(cartItems.filter((_, i) => i !== index))
// //   }

// //   // =============================================
// //   // FUNCIONES DE GUARDADO
// //   // =============================================
  
// //   // Guardar operación
// //   const saveOperation = async () => {
// //     if (cartItems.length === 0) {
// //       alert('Debe agregar al menos un producto')
// //       barcodeRef.current?.focus()
// //       return
// //     }

// //     // Si está habilitado el módulo de pagos, mostrar diálogo
// //     if (company?.isPayment) {
// //       setShowPaymentDialog(true)
// //       setPayments([])
// //       setCurrentPaymentAmount(totals.totalAmount.toFixed(2))
// //       setPaymentType('CN')
// //       setPaymentMethod('E')
// //       setCreditPaymentDate(emissionDate)
// //       setPaymentNotes('')
// //       setTimeout(() => paymentAmountRef.current?.select(), 100)
// //     } else {
// //       // Procesar directamente sin pagos
// //       processOperation([])
// //     }
// //   }

// //   // Procesar la operación con los pagos
// //   const processOperation = async (paymentsList: Payment[]) => {
// //     setProcessing(true)
// //     const currentTime = new Date()
    
// //     try {
// //       const operationData = {
// //         operationType: 'E', // Entrada (Compra)
// //         operationDate: emissionDate,
// //         serial: serie || undefined,
// //         number: numero ? parseInt(numero) : undefined,
// //         emitDate: emissionDate,
// //         emitTime: currentTime.toTimeString().split(' ')[0],
// //         personId: supplier?.id,
// //         userId: user?.id,
// //         companyId: company?.id,
// //         currency: 'PEN',
// //         globalDiscountPercent: discountType === 'percent' ? globalDiscount : 0,
// //         globalDiscount: discountType === 'amount' ? globalDiscount : 0,
// //         totalDiscount: totals.discountAmount,
// //         igvPercent: igvPercent,
// //         igvAmount: totals.totalIgv,
// //         totalTaxable: totals.totalTaxable,
// //         totalUnaffected: totals.totalUnaffected,
// //         totalExempt: totals.totalExempt,
// //         totalFree: totals.totalFree,
// //         totalAmount: totals.totalAmount,
// //         items: cartItems.map(item => ({
// //           productId: item.product.id,
// //           quantity: item.quantity,
// //           unitValue: item.unitValue,
// //           unitPrice: item.unitPrice,
// //           discountPercentage: 0,
// //           typeAffectationId: parseInt(item.product.typeAffectation.code)
// //         })),
// //         payments: paymentsList || []
// //       }
      
// //       const response = await graphqlRequest(CREATE_PURCHASE_MUTATION, operationData)
      
// //       if (response.createOperation.success) {
// //         const operation = response.createOperation.operation
        
// //         // Preparar los datos de la compra para impresión
// //         const purchaseForPrint = {
// //           id: operation.id,
// //           serial: operation.serial || serie || 'S/N',
// //           number: operation.number || numero || 'S/N',
// //           operationDate: operationData.operationDate,
// //           emitDate: operationData.emitDate,
// //           emitTime: operationData.emitTime,
// //           operationStatus: '2',
// //           currency: operationData.currency,
// //           totalAmount: operationData.totalAmount,
// //           totalTaxable: operationData.totalTaxable,
// //           totalUnaffected: operationData.totalUnaffected,
// //           totalExempt: operationData.totalExempt,
// //           totalFree: operationData.totalFree,
// //           igvAmount: operationData.igvAmount,
// //           igvPercent: operationData.igvPercent,
// //           globalDiscount: operationData.globalDiscount,
// //           globalDiscountPercent: operationData.globalDiscountPercent,
// //           totalDiscount: operationData.totalDiscount,
// //           person: supplier || {
// //             fullName: 'PROVEEDOR GENERAL',
// //             document: '00000000',
// //             personType: '1'
// //           },
// //           user: user,
// //           details: cartItems.map(item => ({
// //             description: item.product.description,
// //             quantity: item.quantity,
// //             unitValue: item.unitValue,
// //             unitPrice: item.unitPrice,
// //             totalValue: item.totalValue,
// //             totalIgv: item.totalIgv,
// //             totalAmount: item.totalAmount,
// //             product: {
// //               id: item.product.id,
// //               code: item.product.code,
// //               description: item.product.description,
// //               typeAffectation: item.product.typeAffectation,
// //               unit: item.product.unit
// //             }
// //           })),
// //           paymentSet: paymentsList || []
// //         }
        
// //         // IMPRIMIR AUTOMÁTICAMENTE EN SEGUNDO PLANO
// //         console.log('Iniciando impresión automática de compra...')
// //         PrintService.printSale(purchaseForPrint, company).then(printResult => {
// //           if (printResult.success) {
// //             console.log('✅ Compra impresa exitosamente')
// //           } else {
// //             console.error('❌ Error al imprimir:', printResult.error)
// //           }
// //         }).catch(error => {
// //           console.error('❌ Error crítico al imprimir:', error)
// //         })
        
// //         // Mostrar mensaje de éxito y continuar
// //         alert(`Compra ${operation.serial || serie || 'S/N'}-${operation.number || numero || 'S/N'} guardada exitosamente`)
        
// //         // Redirigir a la lista de compras
// //         navigate('/purchases')
// //       } else {
// //         alert(`Error: ${response.createOperation.message}`)
// //       }
// //     } catch (error) {
// //       console.error('Error al guardar compra:', error)
// //       alert('Error al procesar la compra')
// //     } finally {
// //       setProcessing(false)
// //       setShowPaymentDialog(false)
// //     }
// //   }

// //   // Agregar pago
// //   const addPayment = () => {
// //     const amount = parseFloat(currentPaymentAmount.replace(',', '.'))
// //     if (isNaN(amount) || amount <= 0) return

// //     const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
// //     const remaining = totals.totalAmount - totalPaid

// //     if (amount > remaining + 0.01) {
// //       alert(`El monto excede el restante: S/ ${remaining.toFixed(2)}`)
// //       return
// //     }

// //     const currentDateTime = new Date()
// //     const paymentBaseDate = paymentType === 'CR' ? creditPaymentDate : emissionDate
// //     const paymentDateTime = new Date(paymentBaseDate)
    
// //     paymentDateTime.setHours(currentDateTime.getHours())
// //     paymentDateTime.setMinutes(currentDateTime.getMinutes())
// //     paymentDateTime.setSeconds(currentDateTime.getSeconds())
// //     paymentDateTime.setMilliseconds(currentDateTime.getMilliseconds())

// //     const newPayment: Payment = {
// //       paymentType: paymentType,
// //       paymentMethod: paymentMethod,
// //       status: 'C',
// //       paymentDate: paymentDateTime.toISOString().slice(0, 19).replace('T', ' '),
// //       paidAmount: amount,
// //       notes: paymentNotes || undefined
// //     }

// //     setPayments([...payments, newPayment])
// //     setPaymentNotes('')
    
// //     const newTotalPaid = totalPaid + amount
// //     const newRemaining = totals.totalAmount - newTotalPaid
    
// //     if (Math.abs(newRemaining) < 0.01) {
// //       setCurrentPaymentAmount('')
// //       setTimeout(() => {
// //         const confirmButton = document.getElementById('confirm-payment-button')
// //         confirmButton?.focus()
// //       }, 100)
// //     } else {
// //       setCurrentPaymentAmount(newRemaining.toFixed(2))
// //       setTimeout(() => {
// //         paymentAmountRef.current?.select()
// //       }, 100)
// //     }
// //   }

// //   // Eliminar pago
// //   const removePayment = (index: number) => {
// //     const newPayments = payments.filter((_, i) => i !== index)
// //     setPayments(newPayments)
    
// //     const totalPaid = newPayments.reduce((sum, p) => sum + p.paidAmount, 0)
// //     const remaining = totals.totalAmount - totalPaid
    
// //     setCurrentPaymentAmount(remaining.toFixed(2))
// //     setTimeout(() => {
// //       paymentAmountRef.current?.select()
// //     }, 100)
// //   }

// //   // Confirmar pagos
// //   const confirmPayments = () => {
// //     const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    
// //     if (Math.abs(totalPaid - totals.totalAmount) > 0.01) {
// //       alert(`El total pagado (S/ ${totalPaid.toFixed(2)}) no coincide con el total de la compra (S/ ${totals.totalAmount.toFixed(2)})`)
// //       return
// //     }

// //     processOperation(payments)
// //   }

// //   // Obtener nombre del método de pago
// //   const getPaymentMethodName = (method: string) => {
// //     const methods: Record<string, string> = {
// //       'E': 'Efectivo',
// //       'Y': 'Yape',
// //       'P': 'Plin',
// //       'T': 'Tarjeta',
// //       'B': 'Transferencia'
// //     }
// //     return methods[method] || method
// //   }

// //   // Obtener ícono del método de pago
// //   const getPaymentMethodIcon = (method: string) => {
// //     switch(method) {
// //       case 'E': return '💵'
// //       case 'Y': return '📱'
// //       case 'P': return '📱'
// //       case 'T': return '💳'
// //       case 'B': return '🏦'
// //       default: return '💰'
// //     }
// //   }

// //   // Calcular totales
// //   const totals = calculateTotals()

// //  return (
// //     <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
// //       {/* Header Ultra Moderno */}
// //       <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white px-4 py-2.5 shadow-xl">
// //         <div className="flex items-center justify-between">
// //           <div className="flex items-center space-x-3">
// //             <button
// //               onClick={() => navigate('/purchases')}
// //               className="bg-white/10 p-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
// //             >
// //               <ArrowLeft className="w-5 h-5" />
// //             </button>
// //             <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
// //               <ShoppingBag className="w-5 h-5" />
// //             </div>
// //             <div>
// //               <h1 className="text-lg font-bold tracking-tight">Nueva Compra</h1>
// //               <p className="text-xs text-purple-300 leading-tight">{company?.denomination || 'Mi Empresa'}</p>
// //             </div>
// //           </div>
// //           <div className="flex items-center space-x-4 text-sm">
// //             <div className="text-right">
// //               <p className="font-semibold tracking-tight">{user?.firstName} {user?.lastName}</p>
// //               <p className="text-xs text-purple-300">Usuario</p>
// //             </div>
// //             <div className="h-6 w-px bg-purple-400"></div>
// //             <div className="text-right">
// //               <p className="font-semibold tracking-tight">{new Date().toLocaleDateString('es-PE')}</p>
// //               <p className="text-xs text-purple-300 flex items-center">
// //                 <Clock className="w-3 h-3 mr-1" />
// //                 {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
// //               </p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="flex-1 flex overflow-hidden">
// //         {/* Panel Principal */}
// //         <div className="flex-1 flex flex-col p-3">
          
// //           {/* Controles Superiores */}
// //           <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-slate-200">
// //             <div className="flex items-center space-x-3">
// //               {/* Serie y Número (Opcionales) */}
// //               <div className="flex items-center space-x-2">
// //                 <div>
// //                   <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Serie (Opcional)</label>
// //                   <input
// //                     ref={serieRef}
// //                     type="text"
// //                     value={serie}
// //                     onChange={(e) => setSerie(e.target.value.toUpperCase())}
// //                     placeholder="F001"
// //                     className="px-2 py-1.5 w-20 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium uppercase"
// //                   />
// //                 </div>
                
// //                 <div>
// //                   <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Número (Opcional)</label>
// //                   <input
// //                     ref={numeroRef}
// //                     type="text"
// //                     value={numero}
// //                     onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
// //                     placeholder="001"
// //                     className="px-2 py-1.5 w-24 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
// //                   />
// //                 </div>
// //               </div>

// //               {/* Fecha */}
// //               <div>
// //                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Fecha</label>
// //                 <input
// //                   ref={dateRef}
// //                   type="date"
// //                   value={emissionDate}
// //                   onChange={(e) => setEmissionDate(e.target.value)}
// //                   className="px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
// //                 />
// //               </div>

// //               {/* Proveedor */}
// //               <div className="flex-1">
// //                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Proveedor (F2)</label>
// //                 <div className="relative">
// //                   <div className="flex items-center space-x-2">
// //                     <div className="relative flex-1">
// //                       <input
// //                         ref={supplierSearchRef}
// //                         type="text"



// // src/pages/purchases/PurchasePage.tsx
// import { useState, useEffect, useRef, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { PrintService } from '../../services/printService'
// import { 
//   Search, 
//   Trash2, 
//   ShoppingBag,
//   User,
//   Package,
//   Percent,
//   DollarSign,
//   AlertCircle,
//   X,
//   Barcode,
//   FileText,
//   Loader2,
//   Calculator,
//   Hash,
//   CreditCard,
//   Clock,
//   ArrowRight,
//   CheckCircle,
//   Calendar,
//   Save,
//   ArrowLeft
// } from 'lucide-react'
// import { useAuthStore } from '../../store/authStore'
// import { graphqlRequest } from '../../services/graphql'
// import SuccessDialog from '../components/SuccessDialog'
// // =============================================
// // INTERFACES
// // =============================================
// interface Person {
//   id?: string
//   document: string
//   fullName: string
//   personType: string
//   address?: string
//   email?: string
//   phone?: string
// }

// interface Product {
//   id: string
//   code: string
//   description: string
//   unitPrice: number
//   stock: number
//   typeAffectation: {
//     code: string
//     name: string
//   }
//   unit: {
//     id: string
//     description: string
//   }
// }

// interface CartItem {
//   product: Product
//   quantity: number
//   unitPrice: number
//   unitValue: number
//   totalValue: number
//   totalIgv: number
//   totalAmount: number
// }

// interface Payment {
//   paymentType: 'CN' | 'CR'
//   paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
//   status: 'P' | 'C'
//   notes?: string
//   paymentDate: string
//   paidAmount: number
// }

// // =============================================
// // QUERIES GRAPHQL
// // =============================================
// const SEARCH_PRODUCTS_QUERY = `
//   query SearchProducts($search: String!, $companyId: ID!, $limit: Int) {
//     searchProducts(search: $search, companyId: $companyId, limit: $limit) {
//       id
//       code
//       description
//       unitPrice
//       stock
//       typeAffectation {
//         code
//         name
//       }
//       unit {
//         id
//         description
//       }
//     }
//   }
// `

// const SEARCH_SUPPLIERS_QUERY = `
//   query SearchSuppliers($search: String!, $limit: Int) {
//     searchPersonsAdvanced(search: $search, limit: $limit) {
//       id
//       document
//       fullName
//       personType
//       address
//       phone
//       email
//     }
//   }
// `

// const CREATE_PURCHASE_MUTATION = `
//   mutation CreatePurchase(
//     $operationType: String!
//     $operationDate: String!
//     $serial: String
//     $number: Int
//     $emitDate: String!
//     $emitTime: String!
//     $personId: ID
//     $userId: ID!
//     $companyId: ID!
//     $currency: String
//     $globalDiscountPercent: Float
//     $globalDiscount: Float
//     $totalDiscount: Float
//     $igvPercent: Float
//     $igvAmount: Float!
//     $totalTaxable: Float
//     $totalUnaffected: Float
//     $totalExempt: Float
//     $totalFree: Float
//     $totalAmount: Float!
//     $items: [OperationDetailInput]!
//     $payments: [PaymentInput]!
//   ) {
//     createOperation(
//       operationType: $operationType
//       operationDate: $operationDate
//       serial: $serial
//       number: $number
//       emitDate: $emitDate
//       emitTime: $emitTime
//       personId: $personId
//       userId: $userId
//       companyId: $companyId
//       currency: $currency
//       globalDiscountPercent: $globalDiscountPercent
//       globalDiscount: $globalDiscount
//       totalDiscount: $totalDiscount
//       igvPercent: $igvPercent
//       igvAmount: $igvAmount
//       totalTaxable: $totalTaxable
//       totalUnaffected: $totalUnaffected
//       totalExempt: $totalExempt
//       totalFree: $totalFree
//       totalAmount: $totalAmount
//       items: $items
//       payments: $payments
//     ) {
//       success
//       message
//       operation {
//         id
//         serial
//         number
//       }
//     }
//   }
// `

// // =============================================
// // COMPONENTE PRINCIPAL
// // =============================================
// export default function PurchasePage() {
//   const navigate = useNavigate()
//   const { company, user } = useAuthStore()
//   const igvPercent = company?.igvPercentage || 18
//   const igvFactor = 1 + (igvPercent / 100)
//   const [showSuccessDialog, setShowSuccessDialog] = useState(false)
//   const [successMessage, setSuccessMessage] = useState('')
//   // =============================================
//   // ESTADOS
//   // =============================================
//   const [serie, setSerie] = useState('')
//   const [numero, setNumero] = useState('')
//     // Función para obtener la fecha local actual
//   const getLocalDate = () => {
//     const now = new Date()
//     const year = now.getFullYear()
//     const month = String(now.getMonth() + 1).padStart(2, '0')
//     const day = String(now.getDate()).padStart(2, '0')
//     return `${year}-${month}-${day}`
//   }
//   const [emissionDate, setEmissionDate] = useState(getLocalDate())
  
//   // Proveedor
//   const [supplier, setSupplier] = useState<Person | null>(null)
//   const [searchingSupplier, setSearchingSupplier] = useState(false)
//   const [supplierSearch, setSupplierSearch] = useState('')
//   const [supplierResults, setSupplierResults] = useState<Person[]>([])
//   const [showSupplierResults, setShowSupplierResults] = useState(false)
//   const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(0)
  
//   // Productos
//   const [productSearch, setProductSearch] = useState('')
//   const [barcodeSearch, setBarcodeSearch] = useState('')
//   const [searchingProducts, setSearchingProducts] = useState(false)
//   const [productResults, setProductResults] = useState<Product[]>([])
//   const [showProductResults, setShowProductResults] = useState(false)
//   const [selectedProductIndex, setSelectedProductIndex] = useState(0)
//   const [showProductDialog, setShowProductDialog] = useState(false)
//   const [editingProduct, setEditingProduct] = useState<{
//     product: Product
//     quantity: number
//     unitPrice: number
//   } | null>(null)
  
//   // Carrito
//   const [cartItems, setCartItems] = useState<CartItem[]>([])
//   const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
//   const [globalDiscount, setGlobalDiscount] = useState(0)
  
//   // Estado de procesamiento
//   const [processing, setProcessing] = useState(false)

//   // Estado para pagos
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false)
//   const [paymentType, setPaymentType] = useState<'CN' | 'CR'>('CN')
//   const [paymentMethod, setPaymentMethod] = useState<'E' | 'Y' | 'P' | 'T' | 'B'>('E')
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [currentPaymentAmount, setCurrentPaymentAmount] = useState('')
//   const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(-1)
//   const [creditPaymentDate, setCreditPaymentDate] = useState(emissionDate)
//   const [paymentNotes, setPaymentNotes] = useState('')
  
//   // =============================================
//   // REFERENCIAS
//   // =============================================
//   const serieRef = useRef<HTMLInputElement>(null)
//   const numeroRef = useRef<HTMLInputElement>(null)
//   const dateRef = useRef<HTMLInputElement>(null)
//   const supplierSearchRef = useRef<HTMLInputElement>(null)
//   const productSearchRef = useRef<HTMLInputElement>(null)
//   const barcodeRef = useRef<HTMLInputElement>(null)
//   const discountInputRef = useRef<HTMLInputElement>(null)
//   const quantityDialogRef = useRef<HTMLInputElement>(null)
//   const priceDialogRef = useRef<HTMLInputElement>(null)
//   const paymentAmountRef = useRef<HTMLInputElement>(null)
//   const creditDateRef = useRef<HTMLInputElement>(null)
//   const notesRef = useRef<HTMLInputElement>(null)

//   // =============================================
//   // EFECTOS
//   // =============================================
//   useEffect(() => {
//     setTimeout(() => barcodeRef.current?.focus(), 100)
//   }, [])

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.altKey) {
//         const activeElement = document.activeElement as HTMLElement
//         if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'SELECT') {
//           e.preventDefault()
//           barcodeRef.current?.focus()
//         }
//       }
//       else if (e.key === 'F1') {
//         e.preventDefault()
//         productSearchRef.current?.focus()
//       }
//       else if (e.key === 'F2') {
//         e.preventDefault()
//         supplierSearchRef.current?.focus()
//       }
//       else if (e.key === 'F3') {
//         e.preventDefault()
//         discountInputRef.current?.select()
//       }
//       else if (e.key === 'F12') {
//         e.preventDefault()
//         saveOperation()
//       }
//       else if (e.key === 'Escape') {
//         setShowSupplierResults(false)
//         setShowProductResults(false)
//       }
//     }

//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [cartItems, supplier])

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (showSupplierResults && supplierResults.length > 0) {
//         if (e.key === 'ArrowDown') {
//           e.preventDefault()
//           setSelectedSupplierIndex(prev => 
//             prev < supplierResults.length - 1 ? prev + 1 : 0
//           )
//         } else if (e.key === 'ArrowUp') {
//           e.preventDefault()
//           setSelectedSupplierIndex(prev => 
//             prev > 0 ? prev - 1 : supplierResults.length - 1
//           )
//         } else if (e.key === 'Enter') {
//           e.preventDefault()
//           selectSupplier(supplierResults[selectedSupplierIndex])
//         }
//       } else if (showProductResults && productResults.length > 0) {
//         if (e.key === 'ArrowDown') {
//           e.preventDefault()
//           setSelectedProductIndex(prev => 
//             prev < productResults.length - 1 ? prev + 1 : 0
//           )
//         } else if (e.key === 'ArrowUp') {
//           e.preventDefault()
//           setSelectedProductIndex(prev => 
//             prev > 0 ? prev - 1 : productResults.length - 1
//           )
//         } else if (e.key === 'Enter') {
//           e.preventDefault()
//           selectProduct(productResults[selectedProductIndex])
//         }
//       }
//     }

//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [showSupplierResults, showProductResults, supplierResults, productResults, 
//       selectedSupplierIndex, selectedProductIndex])

//   // =============================================
//   // FUNCIONES DE CÁLCULO
//   // =============================================
//   const calculateUnitValue = (unitPrice: number): number => {
//     return Number((unitPrice / igvFactor).toFixed(6))
//   }

//   const calculateTotals = () => {
//     let totalTaxable = 0
//     let totalExempt = 0
//     let totalUnaffected = 0
//     let totalFree = 0
//     let totalIgv = 0

//     cartItems.forEach((item) => {
//       const affectationCode = String(item.product.typeAffectation.code)
      
//       if (affectationCode === '10') {
//         totalTaxable += item.totalValue
//         totalIgv += item.totalIgv
//       } else if (affectationCode === '20') {
//         totalExempt += item.totalValue
//       } else if (affectationCode === '30') {
//         totalUnaffected += item.totalValue
//       } else if (affectationCode === '40') {
//         totalFree += item.totalValue
//       }
//     })

//     const subtotal = totalTaxable + totalExempt + totalUnaffected + totalFree
//     const totalBeforeDiscount = subtotal + totalIgv

//     let discountAmount = 0
//     if (globalDiscount > 0) {
//       if (discountType === 'percent') {
//         discountAmount = totalBeforeDiscount * (globalDiscount / 100)
//       } else {
//         discountAmount = globalDiscount
//       }
//     }

//     const totalAmount = totalBeforeDiscount - discountAmount

//     return {
//       subtotal,
//       totalTaxable,
//       totalExempt,
//       totalUnaffected,
//       totalFree,
//       totalIgv,
//       discountAmount,
//       totalAmount
//     }
//   }

//   // =============================================
//   // FUNCIONES DE BÚSQUEDA
//   // =============================================
//   const searchSuppliers = useCallback(async (search: string) => {
//     if (!search || search.length < 2) {
//       setSupplierResults([])
//       setShowSupplierResults(false)
//       return
//     }

//     setSearchingSupplier(true)
//     try {
//       const { searchPersonsAdvanced } = await graphqlRequest(SEARCH_SUPPLIERS_QUERY, {
//         search,
//         limit: 10
//       })
//       setSupplierResults(searchPersonsAdvanced || [])
//       setShowSupplierResults(true)
//       setSelectedSupplierIndex(0)
//     } catch (error) {
//       console.error('Error buscando proveedores:', error)
//     } finally {
//       setSearchingSupplier(false)
//     }
//   }, [])

//   const searchProducts = useCallback(async (search: string) => {
//     if (!search || search.length < 2) {
//       setProductResults([])
//       setShowProductResults(false)
//       return
//     }

//     setSearchingProducts(true)
//     try {
//       const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
//         search,
//         companyId: company?.id,
//         limit: 20
//       })
//       setProductResults(searchProducts || [])
//       setShowProductResults(true)
//       setSelectedProductIndex(0)
//     } catch (error) {
//       console.error('Error buscando productos:', error)
//     } finally {
//       setSearchingProducts(false)
//     }
//   }, [company?.id])

//   const searchByBarcode = useCallback(async (barcode: string) => {
//     if (!barcode) return

//     setSearchingProducts(true)
//     try {
//       const { searchProducts } = await graphqlRequest(SEARCH_PRODUCTS_QUERY, {
//         search: barcode,
//         companyId: company?.id,
//         limit: 1
//       })
      
//       if (searchProducts && searchProducts.length > 0) {
//         const product = searchProducts[0]
        
//         setCartItems(prevItems => {
//           const existingIndex = prevItems.findIndex(item => item.product.id === product.id)
          
//           if (existingIndex >= 0) {
//             const newItems = [...prevItems]
//             const newQuantity = newItems[existingIndex].quantity + 1
            
//             const affectationCode = String(product.typeAffectation.code)
//             let totalAmount, unitValue, totalValue, totalIgv
            
//             if (affectationCode === '10') {
//               totalAmount = product.unitPrice * newQuantity
//               unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
//               totalValue = Number((unitValue * newQuantity).toFixed(2))
//               totalIgv = Number((totalAmount - totalValue).toFixed(2))
//             } else {
//               totalAmount = product.unitPrice * newQuantity
//               unitValue = product.unitPrice
//               totalValue = totalAmount
//               totalIgv = 0
//             }
            
//             newItems[existingIndex] = {
//               ...newItems[existingIndex],
//               quantity: newQuantity,
//               unitValue: unitValue,
//               totalValue: totalValue,
//               totalIgv: totalIgv,
//               totalAmount: totalAmount
//             }
            
//             return newItems
//           } else {
//             const affectationCode = String(product.typeAffectation.code)
//             let totalAmount, unitValue, totalValue, totalIgv
            
//             if (affectationCode === '10') {
//               totalAmount = product.unitPrice * 1
//               unitValue = Number((product.unitPrice / igvFactor).toFixed(6))
//               totalValue = Number((unitValue * 1).toFixed(2))
//               totalIgv = Number((totalAmount - totalValue).toFixed(2))
//             } else {
//               totalAmount = product.unitPrice * 1
//               unitValue = product.unitPrice
//               totalValue = totalAmount
//               totalIgv = 0
//             }
            
//             const newItem: CartItem = {
//               product: product,
//               quantity: 1,
//               unitPrice: product.unitPrice,
//               unitValue: unitValue,
//               totalValue: totalValue,
//               totalIgv: totalIgv,
//               totalAmount: totalAmount
//             }
            
//             return [...prevItems, newItem]
//           }
//         })
        
//         setBarcodeSearch('')
//         barcodeRef.current?.focus()
//       }
//     } catch (error) {
//       console.error('Error buscando por código de barras:', error)
//     } finally {
//       setSearchingProducts(false)
//     }
//   }, [company?.id, igvFactor])

//   const searchSupplierByDocument = async () => {
//     if (!supplierSearch || supplierSearch.length < 3) return
    
//     setSearchingSupplier(true)
//     try {
//       const { searchPerson } = await graphqlRequest(`
//         query SearchPerson($document: String!) {
//           searchPerson(document: $document) {
//             document
//             fullName
//             personType
//             address
//             phone
//             email
//           }
//         }
//       `, { document: supplierSearch })
      
//       if (searchPerson && searchPerson.length > 0) {
//         selectSupplier(searchPerson[0])
//       } else {
//         alert('Proveedor no encontrado')
//       }
//     } catch (error) {
//       console.error('Error buscando proveedor:', error)
//       alert('Error al buscar proveedor')
//     } finally {
//       setSearchingSupplier(false)
//     }
//   }

//   // =============================================
//   // FUNCIONES DE MANEJO DE DATOS
//   // =============================================
//   const selectSupplier = (person: Person) => {
//     setSupplier(person)
//     setSupplierSearch(person.fullName)
//     setShowSupplierResults(false)
//     setSupplierResults([])
//     productSearchRef.current?.focus()
//   }

//   const selectProduct = (product: Product) => {
//     setEditingProduct({
//       product,
//       quantity: 1,
//       unitPrice: product.unitPrice
//     })
//     setShowProductDialog(true)
//     setProductSearch('')
//     setShowProductResults(false)
//     setProductResults([])
//     setTimeout(() => quantityDialogRef.current?.select(), 100)
//   }

//   const addProductFromDialog = () => {
//     if (!editingProduct) return

//     setCartItems(prevItems => {
//       const existingIndex = prevItems.findIndex(item => item.product.id === editingProduct.product.id)
//       const product = editingProduct.product
//       const quantity = editingProduct.quantity
//       const unitPrice = editingProduct.unitPrice
      
//       const affectationCode = String(product.typeAffectation.code)
//       let totalAmount, unitValue, totalValue, totalIgv
      
//       if (affectationCode === '10') {
//         totalAmount = unitPrice * quantity
//         unitValue = Number((unitPrice / igvFactor).toFixed(6))
//         totalValue = Number((unitValue * quantity).toFixed(2))
//         totalIgv = Number((totalAmount - totalValue).toFixed(2))
//       } else {
//         totalAmount = unitPrice * quantity
//         unitValue = unitPrice
//         totalValue = totalAmount
//         totalIgv = 0
//       }
      
//       if (existingIndex >= 0) {
//         const newItems = [...prevItems]
//         newItems[existingIndex] = {
//           ...newItems[existingIndex],
//           quantity: quantity,
//           unitPrice: unitPrice,
//           unitValue: unitValue,
//           totalValue: totalValue,
//           totalIgv: totalIgv,
//           totalAmount: totalAmount
//         }
//         return newItems
//       } else {
//         const newItem: CartItem = {
//           product: product,
//           quantity: quantity,
//           unitPrice: unitPrice,
//           unitValue: unitValue,
//           totalValue: totalValue,
//           totalIgv: totalIgv,
//           totalAmount: totalAmount
//         }
        
//         return [...prevItems, newItem]
//       }
//     })
    
//     setShowProductDialog(false)
//     setEditingProduct(null)
//     productSearchRef.current?.focus()
//   }

//   const updateItemQuantity = (index: number, newQuantity: number) => {
//     if (newQuantity <= 0) return
    
//     setCartItems(prevItems => {
//       const newItems = [...prevItems]
//       const item = newItems[index]
//       const product = item.product
      
//       const affectationCode = String(product.typeAffectation.code)
//       let totalAmount, unitValue, totalValue, totalIgv
      
//       if (affectationCode === '10') {
//         totalAmount = item.unitPrice * newQuantity
//         unitValue = Number((item.unitPrice / igvFactor).toFixed(6))
//         totalValue = Number((unitValue * newQuantity).toFixed(2))
//         totalIgv = Number((totalAmount - totalValue).toFixed(2))
//       } else {
//         totalAmount = item.unitPrice * newQuantity
//         unitValue = item.unitPrice
//         totalValue = totalAmount
//         totalIgv = 0
//       }
      
//       newItems[index] = {
//         ...item,
//         quantity: newQuantity,
//         unitValue: unitValue,
//         totalValue: totalValue,
//         totalIgv: totalIgv,
//         totalAmount: totalAmount
//       }
      
//       return newItems
//     })
//   }

//   const removeItem = (index: number) => {
//     setCartItems(cartItems.filter((_, i) => i !== index))
//   }

//   // =============================================
//   // FUNCIONES DE GUARDADO
//   // =============================================
//   const saveOperation = async () => {
//     if (cartItems.length === 0) {
//       alert('Debe agregar al menos un producto')
//       barcodeRef.current?.focus()
//       return
//     }

//     if (company?.isPayment) {
//       setShowPaymentDialog(true)
//       setPayments([])
//       setCurrentPaymentAmount(totals.totalAmount.toFixed(2))
//       setPaymentType('CN')
//       setPaymentMethod('E')
//       setCreditPaymentDate(emissionDate)
//       setPaymentNotes('')
//       setTimeout(() => paymentAmountRef.current?.select(), 100)
//     } else {
//       processOperation([])
//     }
//   }

//   const processOperation = async (paymentsList: Payment[]) => {
//     setProcessing(true)
//     const currentTime = new Date()
    
//     try {
//       const operationData = {
//         operationType: 'E', // Entrada (Compra)
//         operationDate: emissionDate,
//         serial: serie || undefined,
//         number: numero ? parseInt(numero) : undefined,
//         emitDate: emissionDate,
//         emitTime: currentTime.toTimeString().split(' ')[0],
//         personId: supplier?.id,
//         userId: user?.id,
//         companyId: company?.id,
//         currency: 'PEN',
//         globalDiscountPercent: discountType === 'percent' ? globalDiscount : 0,
//         globalDiscount: discountType === 'amount' ? globalDiscount : 0,
//         totalDiscount: totals.discountAmount,
//         igvPercent: igvPercent,
//         igvAmount: totals.totalIgv,
//         totalTaxable: totals.totalTaxable,
//         totalUnaffected: totals.totalUnaffected,
//         totalExempt: totals.totalExempt,
//         totalFree: totals.totalFree,
//         totalAmount: totals.totalAmount,
//         items: cartItems.map(item => ({
//           productId: item.product.id,
//           quantity: item.quantity,
//           unitValue: item.unitValue,
//           unitPrice: item.unitPrice,
//           discountPercentage: 0,
//           typeAffectationId: parseInt(item.product.typeAffectation.code)
//         })),
//         payments: paymentsList || []
//       }
      
//       const response = await graphqlRequest(CREATE_PURCHASE_MUTATION, operationData)
      
//       if (response.createOperation.success) {
//         const operation = response.createOperation.operation
//         const successMsg = `Compra ${operation.serial}-${operation.number} guardada exitosamente`
//         // Mostrar diálogo de éxito
//         setSuccessMessage(successMsg)
//         setShowSuccessDialog(true)
//         // Preparar datos para impresión
//         // const purchaseForPrint = {
//         //   id: operation.id,
//         //   serial: operation.serial || serie || 'S/N',
//         //   number: operation.number || numero || 'S/N',
//         //   operationDate: operationData.operationDate,
//         //   emitDate: operationData.emitDate,
//         //   emitTime: operationData.emitTime,
//         //   operationStatus: '2',
//         //   currency: operationData.currency,
//         //   totalAmount: operationData.totalAmount,
//         //   totalTaxable: operationData.totalTaxable,
//         //   totalUnaffected: operationData.totalUnaffected,
//         //   totalExempt: operationData.totalExempt,
//         //   totalFree: operationData.totalFree,
//         //   igvAmount: operationData.igvAmount,
//         //   igvPercent: operationData.igvPercent,
//         //   globalDiscount: operationData.globalDiscount,
//         //   globalDiscountPercent: operationData.globalDiscountPercent,
//         //   totalDiscount: operationData.totalDiscount,
//         //   person: supplier || {
//         //     fullName: 'PROVEEDOR GENERAL',
//         //     document: '00000000',
//         //     personType: '1'
//         //   },
//         //   user: user,
//         //   details: cartItems.map(item => ({
//         //     description: item.product.description,
//         //     quantity: item.quantity,
//         //     unitValue: item.unitValue,
//         //     unitPrice: item.unitPrice,
//         //     totalValue: item.totalValue,
//         //     totalIgv: item.totalIgv,
//         //     totalAmount: item.totalAmount,
//         //     product: {
//         //       id: item.product.id,
//         //       code: item.product.code,
//         //       description: item.product.description,
//         //       typeAffectation: item.product.typeAffectation,
//         //       unit: item.product.unit
//         //     }
//         //   })),
//         //   paymentSet: paymentsList || []
//         // }
        
//         // IMPRIMIR AUTOMÁTICAMENTE
//         // PrintService.printSale(purchaseForPrint, company).then(printResult => {
//         //   if (printResult.success) {
//         //     console.log('✅ Compra impresa exitosamente')
//         //   } else {
//         //     console.error('❌ Error al imprimir:', printResult.error)
//         //   }
//         // }).catch(error => {
//         //   console.error('❌ Error crítico al imprimir:', error)
//         // })
        
//         // alert(`Compra ${operation.serial || serie || 'S/N'}-${operation.number || numero || 'S/N'} guardada exitosamente`)
//         // navigate('/purchases')
//         // Redirigir después de cerrar el diálogo
//         setTimeout(() => {
//           setShowSuccessDialog(false)
//           navigate('/purchases')
//         }, 3000)
//       } else {
//         alert(`Error: ${response.createOperation.message}`)
//       }
//     } catch (error) {
//       console.error('Error al guardar compra:', error)
//       alert('Error al procesar la compra')
//     } finally {
//       setProcessing(false)
//       setShowPaymentDialog(false)
//     }
//   }

//   const addPayment = () => {
//     const amount = parseFloat(currentPaymentAmount.replace(',', '.'))
//     if (isNaN(amount) || amount <= 0) return

//     const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
//     const remaining = totals.totalAmount - totalPaid

//     if (amount > remaining + 0.01) {
//       alert(`El monto excede el restante: S/ ${remaining.toFixed(2)}`)
//       return
//     }

//     const currentDateTime = new Date()
//     const paymentBaseDate = paymentType === 'CR' ? creditPaymentDate : emissionDate
//     const paymentDateTime = new Date(paymentBaseDate)
    
//     paymentDateTime.setHours(currentDateTime.getHours())
//     paymentDateTime.setMinutes(currentDateTime.getMinutes())
//     paymentDateTime.setSeconds(currentDateTime.getSeconds())
//     paymentDateTime.setMilliseconds(currentDateTime.getMilliseconds())

//     const newPayment: Payment = {
//       paymentType: paymentType,
//       paymentMethod: paymentMethod,
//       status: 'C',
//       paymentDate: paymentDateTime.toISOString().slice(0, 19).replace('T', ' '),
//       paidAmount: amount,
//       notes: paymentNotes || undefined
//     }

//     setPayments([...payments, newPayment])
//     setPaymentNotes('')
    
//     const newTotalPaid = totalPaid + amount
//     const newRemaining = totals.totalAmount - newTotalPaid
    
//     if (Math.abs(newRemaining) < 0.01) {
//       setCurrentPaymentAmount('')
//       setTimeout(() => {
//         const confirmButton = document.getElementById('confirm-payment-button')
//         confirmButton?.focus()
//       }, 100)
//     } else {
//       setCurrentPaymentAmount(newRemaining.toFixed(2))
//       setTimeout(() => {
//         paymentAmountRef.current?.select()
//       }, 100)
//     }
//   }

//   const removePayment = (index: number) => {
//     const newPayments = payments.filter((_, i) => i !== index)
//     setPayments(newPayments)
    
//     const totalPaid = newPayments.reduce((sum, p) => sum + p.paidAmount, 0)
//     const remaining = totals.totalAmount - totalPaid
    
//     setCurrentPaymentAmount(remaining.toFixed(2))
//     setTimeout(() => {
//       paymentAmountRef.current?.select()
//     }, 100)
//   }

//   const confirmPayments = () => {
//     const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    
//     if (Math.abs(totalPaid - totals.totalAmount) > 0.01) {
//       alert(`El total pagado (S/ ${totalPaid.toFixed(2)}) no coincide con el total de la compra (S/ ${totals.totalAmount.toFixed(2)})`)
//       return
//     }

//     processOperation(payments)
//   }

//   const getPaymentMethodName = (method: string) => {
//     const methods: Record<string, string> = {
//       'E': 'Efectivo',
//       'Y': 'Yape',
//       'P': 'Plin',
//       'T': 'Tarjeta',
//       'B': 'Transferencia'
//     }
//     return methods[method] || method
//   }

//   const getPaymentMethodIcon = (method: string) => {
//     switch(method) {
//       case 'E': return '💵'
//       case 'Y': return '📱'
//       case 'P': return '📱'
//       case 'T': return '💳'
//       case 'B': return '🏦'
//       default: return '💰'
//     }
//   }

//   // Calcular totales
//   const totals = calculateTotals()

//   return (
//     <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
//       {/* Header Ultra Moderno para Compras */}
//       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-xl">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={() => navigate('/purchases')}
//               className="bg-white/10 p-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
//             >
//               <ArrowLeft className="w-5 h-5" />
//             </button>
//             <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
//               <ShoppingBag className="w-5 h-5" />
//             </div>
//             <div>
//               <h1 className="text-lg font-bold tracking-tight">Nueva Compra</h1>
//               <p className="text-xs text-slate-300 leading-tight">{company?.denomination || 'Mi Empresa'}</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4 text-sm">
//             <div className="text-right">
//               <p className="font-semibold tracking-tight">{user?.firstName} {user?.lastName}</p>
//               <p className="text-xs text-slate-300">Usuario</p>
//             </div>
//             <div className="h-6 w-px bg-slate-400"></div>
//             <div className="text-right">
//               <p className="font-semibold tracking-tight">{new Date().toLocaleDateString('es-PE')}</p>
//               <p className="text-xs text-slate-300 flex items-center">
//                 <Clock className="w-3 h-3 mr-1" />
//                 {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 flex overflow-hidden">
//         {/* Panel Principal */}
//         <div className="flex-1 flex flex-col p-3">
          
//           {/* Controles Superiores */}
//           <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-slate-200">
//             <div className="flex items-center space-x-3">
//               {/* Serie y Número (Opcionales) */}
//               <div className="flex items-center space-x-2">
//                 <div>
//                   <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Serie (Opcional)</label>
//                   <input
//                     ref={serieRef}
//                     type="text"
//                     value={serie}
//                     onChange={(e) => setSerie(e.target.value.toUpperCase())}
//                     placeholder="F001"
//                     className="px-2 py-1.5 w-20 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium uppercase"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Número (Opcional)</label>
//                   <input
//                     ref={numeroRef}
//                     type="text"
//                     value={numero}
//                     onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
//                     placeholder="001"
//                     className="px-2 py-1.5 w-24 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
//                   />
//                 </div>
//               </div>

//               {/* Fecha */}
//               <div>
//                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Fecha</label>
//                 <input
//                   ref={dateRef}
//                   type="date"
//                   value={emissionDate}
//                   onChange={(e) => setEmissionDate(e.target.value)}
//                   className="px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
//                 />
//               </div>

//               {/* Proveedor */}
//               <div className="flex-1">
//                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Proveedor (F2)</label>
//                 <div className="relative">
//                   <div className="flex items-center space-x-2">
//                     <div className="relative flex-1">
//                       <input
//                         ref={supplierSearchRef}
//                         type="text"
//                         value={supplierSearch}
//                         onChange={(e) => {
//                           setSupplierSearch(e.target.value)
//                           searchSuppliers(e.target.value)
//                         }}
//                         onFocus={() => {
//                           if (supplierResults.length > 0) {
//                             setShowSupplierResults(true)
//                           }
//                         }}
//                         onBlur={() => {
//                           setTimeout(() => setShowSupplierResults(false), 200)
//                         }}
//                         placeholder="RUC/DNI o nombre..."
//                         className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-tight"
//                       />
//                       <User className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                      
//                       {searchingSupplier && (
//                         <Loader2 className="absolute right-2 top-2 w-3 h-3 text-slate-400 animate-spin" />
//                       )}
//                     </div>
                    
//                     {/* Botón buscar */}
//                     <button
//                       onClick={searchSupplierByDocument}
//                       disabled={searchingSupplier || !supplierSearch}
//                       className="px-2 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
//                       title="Buscar por documento exacto"
//                     >
//                       <Search className="w-3 h-3" />
//                     </button>
//                   </div>
                  
//                   {/* Resultados de proveedores */}
//                   {showSupplierResults && supplierResults.length > 0 && (
//                     <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
//                       {supplierResults.map((person, index) => (
//                         <div
//                           key={person.document}
//                           onClick={() => selectSupplier(person)}
//                           className={`px-3 py-2 cursor-pointer transition-all ${
//                             index === selectedSupplierIndex 
//                               ? 'bg-purple-50 border-l-4 border-purple-500' 
//                               : 'hover:bg-slate-50 border-l-4 border-transparent'
//                           }`}
//                         >
//                           <div className="font-semibold text-xs tracking-tight">{person.fullName}</div>
//                           <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5 font-mono">
//                             <span className="font-medium">{person.personType === '6' ? 'RUC' : 'DNI'}:</span>
//                             <span>{person.document}</span>
//                             {person.address && (
//                               <>
//                                 <span>•</span>
//                                 <span className="truncate">{person.address}</span>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
                  
//                   {/* Proveedor seleccionado */}
//                   {supplier && (
//                     <div className="absolute -bottom-5 left-0 text-xs text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
//                       <CheckCircle className="w-3 h-3 mr-1" />
//                       <span className="font-semibold tracking-tight">{supplier.fullName}</span>
//                       <span className="mx-1">•</span>
//                       <span className="font-mono">{supplier.document}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Búsqueda de Productos */}
//           <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-slate-200">
//             <div className="grid grid-cols-5 gap-3">
//               {/* Código de Barras */}
//               <div className="col-span-1">
//                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Scanner (B)</label>
//                 <div className="relative">
//                   <input
//                     ref={barcodeRef}
//                     type="text"
//                     value={barcodeSearch}
//                     onChange={(e) => setBarcodeSearch(e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         e.preventDefault()
//                         searchByBarcode(barcodeSearch)
//                       }
//                     }}
//                     placeholder="Código QR"
//                     className="w-full pl-7 pr-2 py-1.5 text-xs border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50 font-mono tracking-wider"
//                   />
//                   <Barcode className="absolute left-2 top-2 w-3 h-3 text-red-500" />
//                   {searchingProducts && barcodeSearch && (
//                     <Loader2 className="absolute right-2 top-2 w-3 h-3 text-red-500 animate-spin" />
//                   )}
//                 </div>
//               </div>

//               {/* Búsqueda Manual */}
//               <div className="col-span-4">
//                 <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Buscar Producto (F1)</label>
//                 <div className="relative">
//                   <input
//                     ref={productSearchRef}
//                     type="text"
//                     value={productSearch}
//                     onChange={(e) => {
//                       setProductSearch(e.target.value)
//                       searchProducts(e.target.value)
//                     }}
//                     onFocus={() => {
//                       if (productResults.length > 0) {
//                         setShowProductResults(true)
//                       }
//                     }}
//                     onBlur={() => {
//                       setTimeout(() => setShowProductResults(false), 200)
//                     }}
//                     placeholder="Nombre o código del producto..."
//                     className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-tight"
//                   />
//                   <Search className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                  
//                   {searchingProducts && productSearch && (
//                     <Loader2 className="absolute right-2 top-2 w-3 h-3 text-slate-400 animate-spin" />
//                   )}
                  
//                   {/* Resultados de productos */}
//                   {showProductResults && productResults.length > 0 && (
//                     <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
//                       {productResults.map((product, index) => (
//                         <div
//                           key={product.id}
//                           onClick={() => selectProduct(product)}
//                           className={`px-3 py-2.5 cursor-pointer transition-all ${
//                             index === selectedProductIndex 
//                               ? 'bg-purple-50 border-l-4 border-purple-500' 
//                               : 'hover:bg-slate-50 border-l-4 border-transparent'
//                           }`}
//                         >
//                           <div className="flex justify-between items-start">
//                             <div className="flex-1">
//                               <div className="font-semibold text-xs tracking-tight">{product.description}</div>
//                               <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
//                                 <span className="flex items-center font-mono">
//                                   <Hash className="w-3 h-3 mr-1" />
//                                   {product.code}
//                                 </span>
//                                 <span className="flex items-center">
//                                   <Package className="w-3 h-3 mr-1" />
//                                   Stock: {product.stock}
//                                 </span>
//                                 <span className="text-purple-600 font-medium">{product.typeAffectation.name}</span>
//                               </div>
//                             </div>
//                             <div className="text-right ml-4">
//                               <div className="font-bold text-sm text-purple-600 font-mono">S/ {product.unitPrice.toFixed(2)}</div>
//                               <div className="text-xs text-slate-500">c/IGV</div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Tabla de Items */}
//           <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
//             <div className="overflow-auto h-full">
//               <table className="w-full text-xs">
//                 <thead>
//                   <tr className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white">
//                     <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Cant.</th>
//                     <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Descripción</th>
//                     <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">P.U.</th>
//                     <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Importe</th>
//                     <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider w-12"></th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {cartItems.length === 0 ? (
//                     <tr>
//                       <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
//                         <div className="flex flex-col items-center">
//                           <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full p-4 mb-4">
//                             <Package className="w-12 h-12 text-slate-400" />
//                           </div>
//                           <p className="text-base font-semibold tracking-tight">No hay productos agregados</p>
//                           <p className="text-xs mt-2 text-slate-400">Escanee un código QR o busque productos</p>
//                           <div className="flex items-center space-x-4 mt-4">
//                             <div className="flex items-center text-xs text-slate-500">
//                               <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono font-semibold">B</kbd>
//                               <span className="ml-2 font-medium">Escanear</span>
//                             </div>
//                             <div className="flex items-center text-xs text-slate-500">
//                               <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono font-semibold">F1</kbd>
//                               <span className="ml-2 font-medium">Buscar</span>
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     cartItems.map((item, index) => (
//                       <tr 
//                         key={index} 
//                         className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-purple-50/30 transition-all duration-200 ${
//                           index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
//                         }`}
//                       >
//                         <td className="px-3 py-2">
//                           <input
//                             type="number"
//                             value={item.quantity}
//                             onChange={(e) => {
//                               const value = parseInt(e.target.value) || 0
//                               updateItemQuantity(index, value)
//                             }}
//                             onFocus={(e) => e.target.select()}
//                             onKeyDown={(e) => {
//                               if (e.key === 'Enter') {
//                                 e.preventDefault()
//                                 productSearchRef.current?.focus()
//                               }
//                             }}
//                             className="w-14 px-2 py-1 text-center text-xs border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono font-semibold"
//                             min="1"
//                           />
//                         </td>
//                         <td className="px-3 py-2">
//                           <div>
//                             <p className="font-semibold text-xs text-slate-900 tracking-tight leading-tight">{item.product.description}</p>
//                             <p className="text-xs text-slate-500 flex items-center mt-0.5">
//                               <span className="flex items-center font-mono">
//                                 <Hash className="w-2.5 h-2.5 mr-1" />
//                                 {item.product.code}
//                               </span>
//                               <span className="mx-2">•</span>
//                               <span className="text-purple-600 font-medium">{item.product.typeAffectation.name}</span>
//                             </p>
//                           </div>
//                         </td>
//                         <td className="px-3 py-2 text-right">
//                           <span className="font-semibold text-xs font-mono tracking-tight">
//                             S/ {(item.unitPrice || 0).toFixed(2)}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2 text-right">
//                           <span className="font-bold text-sm text-purple-600 font-mono tracking-tight">
//                             S/ {(item.totalAmount || 0).toFixed(2)}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2 text-center">
//                           <button
//                             onClick={() => removeItem(index)}
//                             className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                             title="Eliminar producto"
//                           >
//                             <Trash2 className="w-3 h-3" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Panel Lateral */}
//         <div className="w-80 bg-white shadow-xl flex flex-col border-l border-slate-200">
//           {/* Descuento */}
//           <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
//             <h3 className="text-xs font-bold mb-2 text-slate-700 flex items-center tracking-tight">
//               <Percent className="w-3 h-3 mr-2" />
//               Descuento Global (F3)
//             </h3>
//             <div className="flex items-center space-x-1 mb-2">
//               <button
//                 onClick={() => setDiscountType('amount')}
//                 className={`flex-1 py-1 text-xs rounded-md font-semibold transition-all ${
//                   discountType === 'amount'
//                     ? 'bg-purple-600 text-white shadow-sm'
//                     : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
//                 }`}
//               >
//                 S/ Monto
//               </button>
//               <button
//                 onClick={() => setDiscountType('percent')}
//                 className={`flex-1 py-1 text-xs rounded-md font-semibold transition-all ${
//                   discountType === 'percent'
//                     ? 'bg-purple-600 text-white shadow-sm'
//                     : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
//                 }`}
//               >
//                 % Porcentaje
//               </button>
//             </div>
//             <input
//               ref={discountInputRef}
//               type="number"
//               value={globalDiscount}
//               onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
//               onFocus={(e) => e.target.select()}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') {
//                   e.preventDefault()
//                   saveOperation()
//                 }
//               }}
//               placeholder={discountType === 'amount' ? '0.00' : '0'}
//               className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 font-mono"
//             />
//           </div>

//           {/* Totales */}
//           <div className="flex-1 p-3 space-y-2 text-xs">
//             <h3 className="font-bold mb-2 text-slate-700 flex items-center tracking-tight">
//               <Calculator className="w-3 h-3 mr-2" />
//               Resumen de Compra
//             </h3>
            
//             {/* Subtotal */}
//             <div className="flex justify-between pb-2 border-b border-slate-200">
//               <span className="text-slate-600 font-medium">Subtotal:</span>
//               <span className="font-bold font-mono">S/ {(totals.subtotal || 0).toFixed(2)}</span>
//             </div>

//             {/* Tipos de operación detallados */}
//             <div className="space-y-1">
//               {/* Op. Gravada */}
//               <div className="flex justify-between text-xs">
//                 <span className="text-slate-500">Op. Gravada:</span>
//                 <span className="text-slate-700 font-mono">S/ {(totals.totalTaxable || 0).toFixed(2)}</span>
//               </div>
              
//               {totals.totalExempt > 0 && (
//                 <div className="flex justify-between text-xs">
//                   <span className="text-slate-500">Op. Exonerada:</span>
//                   <span className="text-slate-700 font-mono">S/ {(totals.totalExempt || 0).toFixed(2)}</span>
//                 </div>
//               )}
//               {totals.totalUnaffected > 0 && (
//                 <div className="flex justify-between text-xs">
//                   <span className="text-slate-500">Op. Inafecta:</span>
//                   <span className="text-slate-700 font-mono">S/ {(totals.totalUnaffected || 0).toFixed(2)}</span>
//                 </div>
//               )}
//               {totals.totalFree > 0 && (
//                 <div className="flex justify-between text-xs">
//                   <span className="text-slate-500">Op. Gratuita:</span>
//                   <span className="text-slate-700 font-mono">S/ {(totals.totalFree || 0).toFixed(2)}</span>
//                 </div>
//               )}
//             </div>

//             {/* IGV */}
//             <div className="flex justify-between pt-2 border-t border-slate-200">
//               <span className="text-slate-600 font-medium">IGV ({igvPercent}%):</span>
//               <span className="font-bold font-mono">S/ {(totals.totalIgv || 0).toFixed(2)}</span>
//             </div>

//             {/* Descuento */}
//             {totals.discountAmount > 0 && (
//               <div className="flex justify-between text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200">
//                 <span className="font-semibold">Descuento:</span>
//                 <span className="font-bold font-mono">- S/ {(totals.discountAmount || 0).toFixed(2)}</span>
//               </div>
//             )}

//             {/* Total */}
//             <div className="flex justify-between pt-3 border-t-2 border-slate-300 text-lg font-bold">
//               <span className="tracking-tight">TOTAL:</span>
//               <span className="text-purple-600 font-mono tracking-tight">S/ {(totals.totalAmount || 0).toFixed(2)}</span>
//             </div>

//             {/* Información adicional */}
//             <div className="mt-3 p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
//               <div className="text-xs text-purple-700 space-y-1">
//                 <div className="flex items-center">
//                   <span className="font-semibold">Items:</span>
//                   <span className="ml-2 font-mono">{cartItems.length}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <span className="font-semibold">Unidades:</span>
//                   <span className="ml-2 font-mono">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Botones */}
//           <div className="p-3 border-t border-slate-200 space-y-2">
//             <button
//               onClick={saveOperation}
//               disabled={processing || cartItems.length === 0}
//               className={`w-full py-2.5 font-bold rounded-lg transition-all flex items-center justify-center text-sm tracking-tight ${
//                 processing || cartItems.length === 0
//                   ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
//                   : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
//               }`}
//             >
//               {processing ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Procesando...
//                 </>
//               ) : (
//                 <>
//                   <CreditCard className="w-4 h-4 mr-2" />
//                   Procesar Compra (F12)
//                 </>
//               )}
//             </button>

//             <button
//               onClick={() => {
//                 if (cartItems.length > 0 && confirm('¿Está seguro de cancelar la compra actual?')) {
//                   setCartItems([])
//                   setSupplier(null)
//                   setSupplierSearch('')
//                   setGlobalDiscount(0)
//                   barcodeRef.current?.focus()
//                 }
//               }}
//               className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm tracking-tight"
//             >
//               Cancelar Compra
//             </button>
//           </div>

//           {/* Atajos */}
//           <div className="p-2 bg-gradient-to-r from-slate-50 to-slate-100 text-xs text-slate-600 space-y-1 border-t border-slate-200">
//             <div className="font-bold mb-1 text-slate-700 tracking-tight">Atajos de Teclado:</div>
//             <div className="grid grid-cols-2 gap-x-2 gap-y-1">
//               <div className="flex items-center">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">B</kbd>
//                 <span className="ml-2 font-medium">Scanner</span>
//               </div>
//               <div className="flex items-center">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">F1</kbd>
//                 <span className="ml-2 font-medium">Productos</span>
//               </div>
//               <div className="flex items-center">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">F2</kbd>
//                 <span className="ml-2 font-medium">Proveedor</span>
//               </div>
//               <div className="flex items-center">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">F3</kbd>
//                 <span className="ml-2 font-medium">Descuento</span>
//               </div>
//               <div className="col-span-2 flex items-center mt-1">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">F12</kbd>
//                 <span className="ml-2 font-medium">Procesar Compra</span>
//               </div>
//               <div className="col-span-2 flex items-center">
//                 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold">ESC</kbd>
//                 <span className="ml-2 font-medium">Cerrar listas</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Diálogo de Producto */}
//       {showProductDialog && editingProduct && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-bold tracking-tight">Agregar Producto</h3>
//               <button
//                 onClick={() => {
//                   setShowProductDialog(false)
//                   setEditingProduct(null)
//                   productSearchRef.current?.focus()
//                 }}
//                 className="text-slate-400 hover:text-slate-600 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
            
//             <div className="mb-4 p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
//               <p className="font-semibold text-slate-900 tracking-tight">{editingProduct.product.description}</p>
//               <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
//                 <span className="flex items-center font-mono">
//                   <Hash className="w-3 h-3 mr-1" />
//                   {editingProduct.product.code}
//                 </span>
//                 <span className="flex items-center">
//                   <Package className="w-3 h-3 mr-1" />
//                   Stock: {editingProduct.product.stock}
//                 </span>
//               </div>
//               <p className="text-xs text-purple-600 mt-1 font-semibold">
//                 {editingProduct.product.typeAffectation.name}
//               </p>
//             </div>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1 tracking-tight">
//                   Cantidad
//                 </label>
//                 <input
//                   ref={quantityDialogRef}
//                   type="number"
//                   value={editingProduct.quantity}
//                   onChange={(e) => setEditingProduct({
//                     ...editingProduct,
//                     quantity: Math.max(1, parseInt(e.target.value) || 1)
//                   })}
//                   onFocus={(e) => e.target.select()}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault()
//                       priceDialogRef.current?.select()
//                     }
//                   }}
//                   min={1}
//                   max={editingProduct.product.stock}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono font-semibold"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1 tracking-tight">
//                   Precio con IGV
//                 </label>
//                 <div className="relative">
//                   <span className="absolute left-3 top-2 text-slate-500 font-mono">S/</span>
//                   <input
//                     ref={priceDialogRef}
//                     type="number"
//                     value={editingProduct.unitPrice}
//                     onChange={(e) => setEditingProduct({
//                       ...editingProduct,
//                       unitPrice: Math.max(0, parseFloat(e.target.value) || 0)
//                     })}
//                     onFocus={(e) => e.target.select()}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         e.preventDefault()
//                         addProductFromDialog()
//                       }
//                     }}
//                     step="0.01"
//                     className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono font-semibold"
//                   />
//                 </div>
//               </div>
              
//               <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg space-y-2 border border-purple-200">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-slate-600 font-medium">Precio sin IGV:</span>
//                   <span className="font-bold font-mono">S/ {calculateUnitValue(editingProduct.unitPrice).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-slate-600 font-medium">IGV ({igvPercent}%):</span>
//                   <span className="font-bold font-mono">S/ {(editingProduct.unitPrice - calculateUnitValue(editingProduct.unitPrice)).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-base font-bold pt-2 border-t border-purple-200">
//                   <span className="tracking-tight">Total:</span>
//                   <span className="text-purple-600 font-mono tracking-tight">S/ {(editingProduct.quantity * editingProduct.unitPrice).toFixed(2)}</span>
//                 </div>
//               </div>
              
//               <div className="flex justify-end space-x-2 pt-4">
//                 <button
//                   onClick={() => {
//                     setShowProductDialog(false)
//                     setEditingProduct(null)
//                     productSearchRef.current?.focus()
//                   }}
//                   className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-semibold tracking-tight"
//                 >
//                   Cancelar (ESC)
//                 </button>
//                 <button
//                   onClick={addProductFromDialog}
//                   className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold tracking-tight"
//                 >
//                   Agregar (Enter)
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Diálogo de Pagos */}
//       {showPaymentDialog && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
//                   <CreditCard className="w-5 h-5 text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold text-white tracking-tight">Registro de Pagos</h3>
//               </div>
//               <button
//                 onClick={() => {
//                   setShowPaymentDialog(false)
//                   setPayments([])
//                 }}
//                 className="text-white/70 hover:text-white transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Resumen de montos */}
//             <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
//               <div className="grid grid-cols-3 gap-4 text-center">
//                 <div>
//                   <p className="text-xs text-white/70 font-medium">Total Compra</p>
//                   <p className="text-lg font-bold text-white font-mono">S/ {totals.totalAmount.toFixed(2)}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-white/70 font-medium">Pagado</p>
//                   <p className="text-lg font-bold text-emerald-300 font-mono">
//                     S/ {payments.reduce((sum, p) => sum + p.paidAmount, 0).toFixed(2)}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-white/70 font-medium">Restante</p>
//                   <p className="text-lg font-bold text-yellow-300 font-mono">
//                     S/ {(totals.totalAmount - payments.reduce((sum, p) => sum + p.paidAmount, 0)).toFixed(2)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Tipo de pago */}
//             <div className="mb-4">
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => setPaymentType('CN')}
//                   onKeyDown={(e) => {
//                     if (e.key === 'ArrowRight') {
//                       e.preventDefault()
//                       setPaymentType('CR')
//                       document.getElementById('payment-type-CR')?.focus()
//                     } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
//                       e.preventDefault()
//                       if (paymentType === 'CN') {
//                         document.getElementById('payment-method-A')?.focus()
//                       } else {
//                         creditDateRef.current?.focus()
//                       }
//                     }
//                   }}
//                   onFocus={() => setPaymentType('CN')}
//                   className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
//                     paymentType === 'CN'
//                       ? 'bg-white text-purple-700 shadow-md'
//                       : 'bg-white/20 text-white hover:bg-white/30'
//                   }`}
//                 >
//                   Contado
//                 </button>
//                 <button
//                   onClick={() => setPaymentType('CR')}
//                   onKeyDown={(e) => {
//                     if (e.key === 'ArrowLeft') {
//                       e.preventDefault()
//                       setPaymentType('CN')
//                       document.getElementById('payment-type-CN')?.focus()
//                     } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
//                       e.preventDefault()
//                       if (paymentType === 'CR') {
//                         creditDateRef.current?.focus()
//                       } else {
//                         document.getElementById('payment-method-A')?.focus()
//                       }
//                     }
//                   }}
//                   onFocus={() => setPaymentType('CR')}
//                   className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
//                     paymentType === 'CR'
//                       ? 'bg-white text-purple-700 shadow-md'
//                       : 'bg-white/20 text-white hover:bg-white/30'
//                   }`}
//                 >
//                   Crédito
//                 </button>
//               </div>
//             </div>

//             {/* Métodos de pago y fecha para crédito */}
//             {paymentType === 'CN' ? (
//               <div className="mb-4">
//                 <div className="grid grid-cols-5 gap-2">
//                   {[
//                     { id: 'E', name: 'Efectivo', icon: '💵' },
//                     { id: 'Y', name: 'Yape', icon: '📱' },
//                     { id: 'P', name: 'Plin', icon: '📱' },
//                     { id: 'T', name: 'Tarjeta', icon: '💳' },
//                     { id: 'B', name: 'Transfer', icon: '🏦' }
//                   ].map((method, index) => (
//                     <button
//                       key={method.id}
//                       id={`payment-method-${method.id}`}
//                       onClick={() => setPaymentMethod(method.id as any)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'ArrowRight' && index < 4) {
//                           e.preventDefault()
//                           const nextId = ['E', 'Y', 'P', 'T', 'B'][index + 1]
//                           document.getElementById(`payment-method-${nextId}`)?.focus()
//                         } else if (e.key === 'ArrowLeft' && index > 0) {
//                           e.preventDefault()
//                           const prevId = ['E', 'Y', 'P', 'T', 'B'][index - 1]
//                           document.getElementById(`payment-method-${prevId}`)?.focus()
//                         } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
//                           e.preventDefault()
//                           paymentAmountRef.current?.select()
//                         } else if (e.key === 'ArrowUp') {
//                           e.preventDefault()
//                           const typeButton = paymentType === 'CN' ? 
//                             document.querySelector('[onClick*="CN"]') : 
//                             document.querySelector('[onClick*="CR"]')
//                           ;(typeButton as HTMLElement)?.focus()
//                         }
//                       }}
//                       onFocus={() => {
//                         setPaymentMethod(method.id as any)
//                       }}
//                       className={`py-3 px-2 rounded-lg font-medium transition-all flex flex-col items-center space-y-1 ${
//                         paymentMethod === method.id
//                           ? 'bg-white text-purple-700 shadow-md'
//                           : 'bg-white/20 text-white hover:bg-white/30'
//                       }`}
//                     >
//                       <span className="text-xl">{method.icon}</span>
//                       <span className="text-xs">{method.name}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="mb-4">
//                 <label className="block text-xs text-white/70 font-medium mb-2">
//                   Fecha de Pago
//                   <span className="ml-2 text-white/50 text-xs">(+ hora actual automática)</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     ref={creditDateRef}
//                     type="date"
//                     value={creditPaymentDate}
//                     onChange={(e) => setCreditPaymentDate(e.target.value)}
//                     min={emissionDate}
//                     onKeyDown={(e) => {
//                       if (e.key === 'ArrowDown' || e.key === 'Enter') {
//                         e.preventDefault()
//                         paymentAmountRef.current?.select()
//                       } else if (e.key === 'ArrowUp') {
//                         e.preventDefault()
//                         const typeButton = document.querySelector('[onClick*="CR"]')
//                         ;(typeButton as HTMLElement)?.focus()
//                       }
//                     }}
//                     className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-medium placeholder-white/40 focus:outline-none focus:border-white/60"
//                   />
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">📅</span>
//                 </div>
//                 <p className="text-xs text-white/50 mt-1 flex items-center">
//                   <Clock className="w-3 h-3 mr-1" />
//                   Se registrará con la hora exacta del sistema
//                 </p>
//               </div>
//             )}

//             {/* Monto a pagar */}
//             <div className="mb-4 space-y-3">
//               <div className="relative">
//                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-mono text-lg">S/</span>
//                 <input
//                   ref={paymentAmountRef}
//                   type="text"
//                   inputMode="decimal"
//                   value={currentPaymentAmount}
//                   onChange={(e) => {
//                     const value = e.target.value.replace(/[^0-9.]/g, '')
//                     const parts = value.split('.')
//                     if (parts.length > 2) return
//                     if (parts[1] && parts[1].length > 2) return
//                     setCurrentPaymentAmount(value)
//                   }}
//                   onFocus={(e) => e.target.select()}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault()
//                       addPayment()
//                     } else if (e.key === 'ArrowUp') {
//                       e.preventDefault()
//                       if (paymentType === 'CN') {
//                         document.getElementById('payment-method-A')?.focus()
//                       } else {
//                         creditDateRef.current?.focus()
//                       }
//                     } else if (e.key === 'ArrowDown') {
//                       e.preventDefault()
//                       notesRef.current?.focus()
//                     }
//                   }}
//                   placeholder="0.00"
//                   className="w-full pl-10 pr-16 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white text-2xl font-mono placeholder-white/40 focus:outline-none focus:border-white/60 text-center"
//                 />
//                 <button
//                   onClick={addPayment}
//                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-lg flex items-center justify-center transition-colors shadow-lg"
//                 >
//                   <span className="text-2xl font-bold">+</span>
//                 </button>
//               </div>
              
//               {/* Indicador de fecha y hora */}
//               <p className="text-xs text-white/50 flex items-center justify-center">
//                 <Clock className="w-3 h-3 mr-1" />
//                 {paymentType === 'CN' 
//                   ? `Fecha: ${new Date(emissionDate).toLocaleDateString('es-PE')} + hora actual`
//                   : `Fecha: ${new Date(creditPaymentDate).toLocaleDateString('es-PE')} + hora actual`
//                 }
//               </p>
              
//               {/* Campo de notas */}
//               <div>
//                 <input
//                   ref={notesRef}
//                   type="text"
//                   value={paymentNotes}
//                   onChange={(e) => setPaymentNotes(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault()
//                       addPayment()
//                     } else if (e.key === 'ArrowUp') {
//                       e.preventDefault()
//                       paymentAmountRef.current?.focus()
//                     } else if (e.key === 'ArrowDown' && payments.length > 0) {
//                       e.preventDefault()
//                       setSelectedPaymentIndex(0)
//                     }
//                   }}
//                   placeholder="Notas (opcional)"
//                   className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
//                 />
//               </div>
//             </div>

//             {/* Lista de pagos */}
//             {payments.length > 0 && (
//               <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
//                 {payments.map((payment, index) => (
//                   <div
//                     key={index}
//                     className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between ${
//                       selectedPaymentIndex === index ? 'ring-2 ring-white' : ''
//                     }`}
//                     tabIndex={0}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Delete') {
//                         removePayment(index)
//                         setSelectedPaymentIndex(-1)
//                         paymentAmountRef.current?.focus()
//                       } else if (e.key === 'ArrowDown' && index < payments.length - 1) {
//                         e.preventDefault()
//                         setSelectedPaymentIndex(index + 1)
//                       } else if (e.key === 'ArrowUp') {
//                         e.preventDefault()
//                         if (index > 0) {
//                           setSelectedPaymentIndex(index - 1)
//                         } else {
//                           setSelectedPaymentIndex(-1)
//                           paymentAmountRef.current?.focus()
//                         }
//                       } else if (e.key === 'ArrowDown' && index === payments.length - 1) {
//                         e.preventDefault()
//                         setSelectedPaymentIndex(-1)
//                         document.getElementById('cancel-payment-button')?.focus()
//                       }
//                     }}
//                     onFocus={() => setSelectedPaymentIndex(index)}
//                   >
//                     <div className="flex items-center space-x-3">
//                       <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
//                       <div>
//                         <p className="text-white font-semibold text-sm">
//                           {getPaymentMethodName(payment.paymentMethod)} • {payment.paymentType === 'CN' ? 'Contado' : 'Crédito'}
//                         </p>
//                         <p className="text-white/70 text-xs">
//                           {new Date(payment.paymentDate).toLocaleDateString('es-PE')} {new Date(payment.paymentDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
//                           {payment.notes && <span className="ml-2">• {payment.notes}</span>}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <span className="text-white font-bold font-mono">S/ {payment.paidAmount.toFixed(2)}</span>
//                       <button
//                         onClick={() => removePayment(index)}
//                         className="text-red-300 hover:text-red-200 transition-colors"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Botones de acción */}
//             <div className="flex space-x-3">
//               <button
//                 id="cancel-payment-button"
//                 onClick={() => {
//                   setShowPaymentDialog(false)
//                   setPayments([])
//                 }}
//                 onKeyDown={(e) => {
//                   if (e.key === 'ArrowRight') {
//                     e.preventDefault()
//                     document.getElementById('confirm-payment-button')?.focus()
//                   } else if (e.key === 'ArrowUp' && payments.length > 0) {
//                     e.preventDefault()
//                     setSelectedPaymentIndex(payments.length - 1)
//                   }
//                 }}
//                 className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all"
//               >
//                 Cancelar
//               </button>
//               <button
//                 id="confirm-payment-button"
//                 onClick={confirmPayments}
//                 disabled={Math.abs(payments.reduce((sum, p) => sum + p.paidAmount, 0) - totals.totalAmount) > 0.01}
//                 onKeyDown={(e) => {
//                   if (e.key === 'ArrowLeft') {
//                     e.preventDefault()
//                     document.getElementById('cancel-payment-button')?.focus()
//                   } else if (e.key === 'Enter') {
//                     e.preventDefault()
//                     confirmPayments()
//                   }
//                 }}
//                 className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
//                   Math.abs(payments.reduce((sum, p) => sum + p.paidAmount, 0) - totals.totalAmount) > 0.01
//                     ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
//                     : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
//                 }`}
//               >
//                 Confirmar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* Diálogo de Éxito */}
//       <SuccessDialog
//         isOpen={showSuccessDialog}
//         onClose={() => {
//           setShowSuccessDialog(false)
//           navigate('/purchases')
//         }}
//         title="Operación Exitosa"
//         message={successMessage}
//         autoCloseDelay={3000}
//       />
//     </div>
//   )
// }

