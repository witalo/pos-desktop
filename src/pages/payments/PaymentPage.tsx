// src/pages/payments/PaymentPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Save,
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  AlertCircle,
  Loader2,
  Calculator,
  ChevronDown,
  Plus
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// TIPOS E INTERFACES
// =============================================
interface PaymentForm {
  type: 'I' | 'E'
  paymentType: 'CN' | 'CR'
  paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
  status: 'P' | 'C'
  notes: string
  paymentDate: string
  totalAmount: number
  paidAmount: number
}

// =============================================
// MUTATIONS GRAPHQL
// =============================================
const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment(
    $type: String!
    $paymentType: String!
    $paymentMethod: String!
    $status: String!
    $notes: String
    $paymentDate: String!
    $totalAmount: Float!
    $paidAmount: Float!
    $userId: ID!
    $companyId: ID!
  ) {
    createPayment(
      type: $type
      paymentType: $paymentType
      paymentMethod: $paymentMethod
      status: $status
      notes: $notes
      paymentDate: $paymentDate
      totalAmount: $totalAmount
      paidAmount: $paidAmount
      userId: $userId
      companyId: $companyId
    ) {
      success
      message
      payment {
        id
        type
        paymentType
        paymentMethod
        status
        notes
        paymentDate
        totalAmount
        paidAmount
      }
    }
  }
`

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function PaymentPage() {
  const navigate = useNavigate()
  const { company, user } = useAuthStore()
  
  // Estados
  const [formData, setFormData] = useState<PaymentForm>({
    type: 'I',
    paymentType: 'CN',
    paymentMethod: 'E',
    status: 'C',
    notes: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    totalAmount: 0,
    paidAmount: 0
  })
  
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCreditFields, setShowCreditFields] = useState(false)
  const [amountInput, setAmountInput] = useState('')

  // Referencias
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    // Enfocar en el campo de monto al cargar
    setTimeout(() => amountRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    // Actualizar el valor de paidAmount cuando cambie el tipo de pago
    if (formData.paymentType === 'CN') {
      setFormData(prev => ({
        ...prev,
        paidAmount: prev.totalAmount,
        status: 'C'
      }))
      setShowCreditFields(false)
    } else {
      setFormData(prev => ({
        ...prev,
        paidAmount: 0,
        status: 'P'
      }))
      setShowCreditFields(true)
    }
  }, [formData.paymentType, formData.totalAmount])

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        navigate('/payments')
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData])

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0'
    }

    if (formData.paymentType === 'CR' && formData.paidAmount > formData.totalAmount) {
      newErrors.paidAmount = 'El monto pagado no puede ser mayor al total'
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'La descripción es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`
  }

  const handleAmountChange = (value: string) => {
    // Solo permitir números y punto decimal
    const cleanValue = value.replace(/[^0-9.]/g, '')
    
    // Evitar múltiples puntos decimales
    const parts = cleanValue.split('.')
    if (parts.length > 2) return
    
    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) return
    
    setAmountInput(cleanValue)
    
    const numericValue = parseFloat(cleanValue) || 0
    setFormData(prev => ({
      ...prev,
      totalAmount: numericValue,
      paidAmount: prev.paymentType === 'CN' ? numericValue : prev.paidAmount
    }))
  }

  // =============================================
  // FUNCIONES DE NEGOCIO
  // =============================================
  const handleSubmit = async () => {
    if (!validateForm()) return

    setProcessing(true)
    try {
      const currentDateTime = new Date()
      const paymentDateTime = new Date(formData.paymentDate)
      
      // Establecer la hora actual en la fecha seleccionada
      paymentDateTime.setHours(currentDateTime.getHours())
      paymentDateTime.setMinutes(currentDateTime.getMinutes())
      paymentDateTime.setSeconds(currentDateTime.getSeconds())

      const response = await graphqlRequest(CREATE_PAYMENT_MUTATION, {
        type: formData.type,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes,
        paymentDate: paymentDateTime.toISOString().slice(0, 19).replace('T', ' '),
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        userId: user?.id,
        companyId: company?.id
      })

      if (response.createPayment.success) {
        navigate('/payments')
      } else {
        alert(`Error: ${response.createPayment.message}`)
      }
    } catch (error) {
      console.error('Error al guardar movimiento:', error)
      alert('Error al procesar el movimiento')
    } finally {
      setProcessing(false)
    }
  }

  // =============================================
  // RENDERIZADO
  // =============================================
  return (
    <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
      {/* Header Ultra Moderno */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/payments')}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Nuevo Movimiento</h1>
              <p className="text-xs text-slate-300 leading-tight">Registra un ingreso o egreso</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-300">Usuario: {user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-300 flex items-center justify-end mt-0.5">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario Principal */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Tipo de Movimiento - Ultra Destacado */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-slate-200">
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight">Tipo de Movimiento</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, type: 'I' })}
                className={`py-4 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-3 ${
                  formData.type === 'I'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowDownCircle className="w-6 h-6" />
                <span className="text-base">INGRESO</span>
              </button>

              <button
                onClick={() => setFormData({ ...formData, type: 'E' })}
                className={`py-4 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-3 ${
                  formData.type === 'E'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowUpCircle className="w-6 h-6" />
                <span className="text-base">EGRESO</span>
              </button>
            </div>
          </div>

          {/* Forma de Pago */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-slate-200">
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight">Forma de Pago</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setFormData({ ...formData, paymentType: 'CN' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.paymentType === 'CN'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Contado
              </button>

              <button
                onClick={() => setFormData({ ...formData, paymentType: 'CR' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.paymentType === 'CR'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Crédito
              </button>
            </div>

            {/* Método de Pago */}
            <h4 className="text-xs font-semibold text-slate-600 mb-2">Método de Pago</h4>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'E', name: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
                { id: 'Y', name: 'Yape', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'P', name: 'Plin', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'T', name: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'B', name: 'Transfer', icon: <Building2 className="w-4 h-4" /> }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                  className={`py-3 px-2 rounded-lg font-medium transition-all flex flex-col items-center space-y-1 ${
                    formData.paymentMethod === method.id
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method.icon}
                  <span className="text-xs">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-slate-200">
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight">Monto</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-slate-500">S/</span>
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    notesRef.current?.focus()
                  }
                }}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-6 text-3xl font-mono font-bold text-center rounded-lg border-2 ${
                  errors.amount 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-blue-500'
                } focus:border-transparent focus:ring-2 ${
                  formData.type === 'I' ? 'text-emerald-600' : 'text-red-600'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Campos de crédito */}
            {showCreditFields && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Monto Pagado</label>
                  <button
                    onClick={() => setFormData({ ...formData, paidAmount: formData.totalAmount })}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Pagar todo
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-mono text-slate-500">S/</span>
                  <input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, paidAmount: value })
                    }}
                    max={formData.totalAmount}
                    className={`w-full pl-10 pr-3 py-3 text-lg font-mono rounded-lg border ${
                      errors.paidAmount 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-amber-300 focus:ring-amber-500'
                    } focus:border-transparent focus:ring-2`}
                  />
                </div>
                {errors.paidAmount && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.paidAmount}
                  </p>
                )}
                <div className="mt-2 text-xs text-amber-700">
                  <p>Pendiente: <span className="font-bold">{formatCurrency(formData.totalAmount - formData.paidAmount)}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-slate-200">
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight">Descripción del movimiento</h3>
            <textarea
              ref={notesRef}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={formData.type === 'I' 
                ? "Ej: PAGO DE CLIENTE, VENTA DEL DÍA, OTROS INGRESOS..." 
                : "Ej: PAGO DE PROVEEDOR, GASTOS VARIOS, SERVICIOS..."
              }
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg resize-none ${
                errors.notes 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-blue-500'
              } focus:border-transparent focus:ring-2`}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.notes}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-slate-200">
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight">Fecha del movimiento</h3>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setFormData({ ...formData, paymentDate: new Date().toISOString().slice(0, 10) })}
                className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Hoy
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Se registrará con la hora actual del sistema
            </p>
          </div>

          {/* Resumen */}
          <div className={`rounded-lg p-4 mb-4 border-2 ${
            formData.type === 'I' 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="text-sm font-bold mb-3 text-slate-700 tracking-tight flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Resumen del Movimiento
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tipo:</span>
                <span className={`font-bold text-sm ${
                  formData.type === 'I' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {formData.type === 'I' ? 'INGRESO' : 'EGRESO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Método:</span>
                <span className="font-medium text-sm text-slate-900">
                  {formData.paymentMethod === 'E' && 'Efectivo'}
                  {formData.paymentMethod === 'Y' && 'Yape'}
                  {formData.paymentMethod === 'P' && 'Plin'}
                  {formData.paymentMethod === 'T' && 'Tarjeta'}
                  {formData.paymentMethod === 'B' && 'Transferencia'}
                  {' • '}
                  {formData.paymentType === 'CN' ? 'Contado' : 'Crédito'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Fecha:</span>
                <span className="font-medium text-sm text-slate-900">
                  {new Date(formData.paymentDate).toLocaleDateString('es-PE')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Total:</span>
                <span className={`text-xl font-bold font-mono ${
                  formData.type === 'I' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {formData.type === 'I' ? '+' : '-'} {formatCurrency(formData.totalAmount)}
                </span>
              </div>
              {formData.paymentType === 'CR' && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Pagado:</span>
                    <span className="font-medium font-mono">{formatCurrency(formData.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Pendiente:</span>
                    <span className="font-bold text-amber-600 font-mono">
                      {formatCurrency(formData.totalAmount - formData.paidAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/payments')}
              disabled={processing}
              className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all text-sm"
            >
              Cancelar (ESC)
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${
                processing
                  ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Movimiento (Ctrl+S)
                </>
              )}
            </button>
          </div>

          {/* Indicador de atajos */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Presiona <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">ESC</kbd> para cancelar o{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">Ctrl+S</kbd> para guardar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}