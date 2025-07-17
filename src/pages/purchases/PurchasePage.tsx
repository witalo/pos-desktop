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

// =============================================
// TIPOS E INTERFACES
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
    searchPersonsAdvanced(search: $search, limit: $limit, isSupplier: true) {
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

  // =============================================
  // ESTADOS
  // =============================================
  
  // Estados principales
  const [serie, setSerie] = useState('')
  const [numero, setNumero] = useState('')
  const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0])
  
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
  
  // Enfocar código de barras al cargar
  useEffect(() => {
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

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
      // F2 - Buscar proveedor
      else if (e.key === 'F2') {
        e.preventDefault()
        supplierSearchRef.current?.focus()
      }
      // F3 - Enfocar descuento
      else if (e.key === 'F3') {
        e.preventDefault()
        discountInputRef.current?.select()
      }
      // F12 - Procesar compra
      else if (e.key === 'F12') {
        e.preventDefault()
        saveOperation()
      }
      // Escape - Cerrar listas de búsqueda
      else if (e.key === 'Escape') {
        setShowSupplierResults(false)
        setShowProductResults(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartItems, supplier])

  // Navegación en listas de búsqueda
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
  
  // Calcular precio sin IGV desde precio con IGV
  const calculateUnitValue = (unitPrice: number): number => {
    return Number((unitPrice / igvFactor).toFixed(6))
  }

  // Calcular totales generales
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
  
  // Búsqueda de proveedores
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

  // Buscar proveedor por documento
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
            email
            phone
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
  
  // Seleccionar proveedor
  const selectSupplier = (person: Person) => {
    setSupplier(person)
    setSupplierSearch(person.fullName)
    setShowSupplierResults(false)
    setSupplierResults([])
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
    setTimeout(() => quantityDialogRef.current?.select(), 100)
  }

  // Agregar/actualizar producto desde diálogo
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

  // Actualizar cantidad de item
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

  // Eliminar item del carrito
  const removeItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  // =============================================
  // FUNCIONES DE GUARDADO
  // =============================================
  
  // Guardar operación
  const saveOperation = async () => {
    if (cartItems.length === 0) {
      alert('Debe agregar al menos un producto')
      barcodeRef.current?.focus()
      return
    }

    // Si está habilitado el módulo de pagos, mostrar diálogo
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
      // Procesar directamente sin pagos
      processOperation([])
    }
  }

  // Procesar la operación con los pagos
  const processOperation = async (paymentsList: Payment[]) => {
    setProcessing(true)
    const currentTime = new Date()
    
    try {
      const operationData = {
        operationType: 'E', // Entrada (Compra)
        operationDate: emissionDate,
        serial: serie || undefined,
        number: numero ? parseInt(numero) : undefined,
        emitDate: emissionDate,
        emitTime: currentTime.toTimeString().split(' ')[0],
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
        
        // Preparar los datos de la compra para impresión
        const purchaseForPrint = {
          id: operation.id,
          serial: operation.serial || serie || 'S/N',
          number: operation.number || numero || 'S/N',
          operationDate: operationData.operationDate,
          emitDate: operationData.emitDate,
          emitTime: operationData.emitTime,
          operationStatus: '2',
          currency: operationData.currency,
          totalAmount: operationData.totalAmount,
          totalTaxable: operationData.totalTaxable,
          totalUnaffected: operationData.totalUnaffected,
          totalExempt: operationData.totalExempt,
          totalFree: operationData.totalFree,
          igvAmount: operationData.igvAmount,
          igvPercent: operationData.igvPercent,
          globalDiscount: operationData.globalDiscount,
          globalDiscountPercent: operationData.globalDiscountPercent,
          totalDiscount: operationData.totalDiscount,
          person: supplier || {
            fullName: 'PROVEEDOR GENERAL',
            document: '00000000',
            personType: '1'
          },
          user: user,
          details: cartItems.map(item => ({
            description: item.product.description,
            quantity: item.quantity,
            unitValue: item.unitValue,
            unitPrice: item.unitPrice,
            totalValue: item.totalValue,
            totalIgv: item.totalIgv,
            totalAmount: item.totalAmount,
            product: {
              id: item.product.id,
              code: item.product.code,
              description: item.product.description,
              typeAffectation: item.product.typeAffectation,
              unit: item.product.unit
            }
          })),
          paymentSet: paymentsList || []
        }
        
        // IMPRIMIR AUTOMÁTICAMENTE EN SEGUNDO PLANO
        console.log('Iniciando impresión automática de compra...')
        PrintService.printSale(purchaseForPrint, company).then(printResult => {
          if (printResult.success) {
            console.log('✅ Compra impresa exitosamente')
          } else {
            console.error('❌ Error al imprimir:', printResult.error)
          }
        }).catch(error => {
          console.error('❌ Error crítico al imprimir:', error)
        })
        
        // Mostrar mensaje de éxito y continuar
        alert(`Compra ${operation.serial || serie || 'S/N'}-${operation.number || numero || 'S/N'} guardada exitosamente`)
        
        // Redirigir a la lista de compras
        navigate('/purchases')
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

  // Agregar pago
  const addPayment = () => {
    const amount = parseFloat(currentPaymentAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    const remaining = totals.totalAmount - totalPaid

    if (amount > remaining + 0.01) {
      alert(`El monto excede el restante: S/ ${remaining.toFixed(2)}`)
      return
    }

    const currentDateTime = new Date()
    const paymentBaseDate = paymentType === 'CR' ? creditPaymentDate : emissionDate
    const paymentDateTime = new Date(paymentBaseDate)
    
    paymentDateTime.setHours(currentDateTime.getHours())
    paymentDateTime.setMinutes(currentDateTime.getMinutes())
    paymentDateTime.setSeconds(currentDateTime.getSeconds())
    paymentDateTime.setMilliseconds(currentDateTime.getMilliseconds())

    const newPayment: Payment = {
      paymentType: paymentType,
      paymentMethod: paymentMethod,
      status: 'C',
      paymentDate: paymentDateTime.toISOString().slice(0, 19).replace('T', ' '),
      paidAmount: amount,
      notes: paymentNotes || undefined
    }

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

  // Eliminar pago
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

  // Confirmar pagos
  const confirmPayments = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    
    if (Math.abs(totalPaid - totals.totalAmount) > 0.01) {
      alert(`El total pagado (S/ ${totalPaid.toFixed(2)}) no coincide con el total de la compra (S/ ${totals.totalAmount.toFixed(2)})`)
      return
    }

    processOperation(payments)
  }

  // Obtener nombre del método de pago
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

  // Obtener ícono del método de pago
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
      {/* Header Ultra Moderno */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white px-4 py-2.5 shadow-xl">
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
              <p className="text-xs text-purple-300 leading-tight">{company?.denomination || 'Mi Empresa'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-right">
              <p className="font-semibold tracking-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-purple-300">Usuario</p>
            </div>
            <div className="h-6 w-px bg-purple-400"></div>
            <div className="text-right">
              <p className="font-semibold tracking-tight">{new Date().toLocaleDateString('es-PE')}</p>
              <p className="text-xs text-purple-300 flex items-center">
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
          
          {/* Controles Superiores */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-slate-200">
            <div className="flex items-center space-x-3">
              {/* Serie y Número (Opcionales) */}
              <div className="flex items-center space-x-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Serie (Opcional)</label>
                  <input
                    ref={serieRef}
                    type="text"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value.toUpperCase())}
                    placeholder="F001"
                    className="px-2 py-1.5 w-20 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium uppercase"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Número (Opcional)</label>
                  <input
                    ref={numeroRef}
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                    placeholder="001"
                    className="px-2 py-1.5 w-24 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Fecha</label>
                <input
                  ref={dateRef}
                  type="date"
                  value={emissionDate}
                  onChange={(e) => setEmissionDate(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                />
              </div>

              {/* Proveedor */}
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 block mb-1 tracking-tight">Proveedor (F2)</label>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        ref={supplierSearchRef}
                        type="text"