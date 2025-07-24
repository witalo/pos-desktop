// src/pages/payments/PaymentPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Plus,
  Trash2,
  ChevronRight,
  Edit3,
  Hash,
  CalendarDays,
  Check
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

// =============================================
// TIPOS E INTERFACES
// =============================================
interface Installment {
  id: string
  paymentDate: string
  amount: number
  status: 'P' | 'C'
}

interface PaymentForm {
  type: 'I' | 'E'
  paymentType: 'CN' | 'CR'
  paymentMethod: 'E' | 'Y' | 'P' | 'T' | 'B'
  status: 'P' | 'C'
  notes: string
  paymentDate: string
  totalAmount: number
  paidAmount: number
  installments: Installment[]
}

// =============================================
// QUERIES Y MUTATIONS GRAPHQL
// =============================================
const GET_PAYMENT_BY_ID_QUERY = `
  query GetPaymentById($id: Int!) {
    payment(id: $id) {
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
      }
      user {
        id
        username
        firstName
        lastName
      }
    }
  }
`

const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment($input: PaymentInput!) {
    createPayment(input: $input) {
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

const UPDATE_PAYMENT_MUTATION = `
  mutation UpdatePayment($id: Int!, $input: PaymentUpdateInput!) {
    updatePayment(id: $id, input: $input) {
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
  const { id } = useParams()
  const { company, user } = useAuthStore()
  const isEditMode = !!id
  
  // Estados
  const [formData, setFormData] = useState<PaymentForm>({
    type: 'I',
    paymentType: 'CN',
    paymentMethod: 'E',
    status: 'C',
    notes: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    totalAmount: 0,
    paidAmount: 0,
    installments: []
  })
  
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [amountInput, setAmountInput] = useState('')
  const [selectedInstallmentIndex, setSelectedInstallmentIndex] = useState(-1)
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [installmentDate, setInstallmentDate] = useState(new Date().toISOString().slice(0, 10))
  const [showInstallmentForm, setShowInstallmentForm] = useState(false)
  
  // Estados de navegación
  const [activeSection, setActiveSection] = useState<'type' | 'method' | 'amount' | 'installments' | 'notes'>('type')

  // Referencias
  const typeIngresoRef = useRef<HTMLButtonElement>(null)
  const typeEgresoRef = useRef<HTMLButtonElement>(null)
  const methodRefs = useRef<(HTMLButtonElement | null)[]>([])
  const amountRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const installmentAmountRef = useRef<HTMLInputElement>(null)
  const installmentDateRef = useRef<HTMLInputElement>(null)

  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    if (isEditMode) {
      loadPayment()
    } else {
      // Enfocar en tipo al cargar
      setTimeout(() => typeIngresoRef.current?.focus(), 100)
    }
  }, [id])

  // Navegación global con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showInstallmentForm) {
        e.preventDefault()
        navigate('/payments')
      } else if (e.key === 'F12' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData, showInstallmentForm])

  // =============================================
  // FUNCIONES DE CARGA
  // =============================================
  const loadPayment = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const { payment } = await graphqlRequest(GET_PAYMENT_BY_ID_QUERY, { id: parseInt(id) })
      if (payment) {
        // Manejar la fecha correctamente (considerando zona horaria local)
        const paymentDate = new Date(payment.paymentDate);
        const formattedDate = formatLocalDate(paymentDate);
        setFormData({
          type: payment.type,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          notes: payment.notes || '',
          paymentDate: formattedDate,
          totalAmount: payment.totalAmount,
          paidAmount: payment.paidAmount,
          installments: []
        })
        setAmountInput(payment.totalAmount.toString())
      }
    } catch (error) {
      console.error('Error cargando movimiento:', error)
      alert('Error al cargar el movimiento')
      navigate('/payments')
    } finally {
      setLoading(false)
    }
  }
  // Función para formatear la fecha en formato YYYY-MM-DD (local)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0'
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'La descripción es requerida'
    }

    if (formData.paymentType === 'CR' && formData.installments.length === 0) {
      newErrors.installments = 'Debe agregar al menos una cuota'
    }

    if (formData.paymentType === 'CR') {
      const totalInstallments = formData.installments.reduce((sum, inst) => sum + inst.amount, 0)
      if (totalInstallments > formData.totalAmount) {
        newErrors.installments = 'El total de cuotas excede el monto total'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCurrency = (amount: number | string) => {
    // Convertir a número si es string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `S/ ${numericAmount.toFixed(2)}`;
  }

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    
    setAmountInput(cleanValue)
    
    const numericValue = parseFloat(cleanValue) || 0
    setFormData(prev => ({
      ...prev,
      totalAmount: numericValue,
      paidAmount: prev.paymentType === 'CN' ? numericValue : prev.paidAmount
    }))
  }

  // Actualizar paidAmount cuando cambie paymentType
  const handlePaymentTypeChange = (newType: 'CN' | 'CR') => {
    if (newType === 'CN') {
      setFormData(prev => ({
        ...prev,
        paymentType: newType,
        paidAmount: prev.totalAmount,
        status: 'C',
        installments: []
      }))
      setShowInstallmentForm(false)
    } else {
      setFormData(prev => ({
        ...prev,
        paymentType: newType,
        paidAmount: 0,
        status: 'P'
      }))
    }
  }

  // =============================================
  // FUNCIONES DE CUOTAS
  // =============================================
  const addInstallment = () => {
    const amount = parseFloat(installmentAmount) || 0
    if (amount <= 0) return

    const remainingAmount = formData.totalAmount - formData.installments.reduce((sum, inst) => sum + inst.amount, 0)
    if (amount > remainingAmount) {
      alert(`El monto excede el restante: ${formatCurrency(remainingAmount)}`)
      return
    }

    const newInstallment: Installment = {
      id: Date.now().toString(),
      paymentDate: installmentDate,
      amount: amount,
      status: 'P'
    }

    const newInstallments = [...formData.installments, newInstallment]
    const totalInstallments = newInstallments.reduce((sum, inst) => sum + inst.amount, 0)
    
    setFormData(prev => ({
      ...prev,
      installments: newInstallments,
      paidAmount: totalInstallments,
      status: totalInstallments >= prev.totalAmount ? 'C' : 'P'
    }))

    // Limpiar formulario de cuota
    setInstallmentAmount('')
    setInstallmentDate(new Date().toISOString().slice(0, 10))
    setShowInstallmentForm(false)
    
    // Si el total de cuotas es igual al monto total, ir a notas
    if (totalInstallments >= formData.totalAmount) {
      setTimeout(() => notesRef.current?.focus(), 100)
      setActiveSection('notes')
    } else {
      // Si no, permitir agregar más cuotas
      setShowInstallmentForm(true)
      setTimeout(() => installmentAmountRef.current?.focus(), 100)
    }
  }

  const removeInstallment = (index: number) => {
    const newInstallments = formData.installments.filter((_, i) => i !== index)
    const totalInstallments = newInstallments.reduce((sum, inst) => sum + inst.amount, 0)
    
    setFormData(prev => ({
      ...prev,
      installments: newInstallments,
      paidAmount: totalInstallments,
      status: totalInstallments >= prev.totalAmount ? 'C' : 'P'
    }))
  }

  const generateInstallments = (numberOfInstallments: number) => {
    if (numberOfInstallments <= 0 || !formData.totalAmount) return

    const installmentAmount = formData.totalAmount / numberOfInstallments
    const baseDate = new Date()
    const newInstallments: Installment[] = []

    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)
      
      newInstallments.push({
        id: Date.now().toString() + i,
        paymentDate: installmentDate.toISOString().slice(0, 10),
        amount: Number(installmentAmount.toFixed(2)),
        status: 'P'
      })
    }

    const totalInstallments = newInstallments.reduce((sum, inst) => sum + inst.amount, 0)
    
    setFormData(prev => ({
      ...prev,
      installments: newInstallments,
      paidAmount: totalInstallments,
      status: totalInstallments >= prev.totalAmount ? 'C' : 'P'
    }))
    
    setShowInstallmentForm(false)
    setTimeout(() => notesRef.current?.focus(), 100)
    setActiveSection('notes')
  }

  // =============================================
  // FUNCIONES DE NEGOCIO
  // =============================================
const handleSubmit = async () => {
  if (!validateForm()) return;

  setProcessing(true);
  try {
    // Obtener la fecha y hora actual en zona horaria local
    const now = new Date();
    const localDateTimeString = formatLocalDateTime(now);

    // Función para transformar los nombres de campos a camelCase
    const transformToBackendFormat = (data: any) => ({
      type: data.type,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      status: data.status,
      notes: data.notes,
      paymentDate: localDateTimeString,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      userId: parseInt(user?.id || '0'),
      companyId: parseInt(company?.id || '0')
    });

    if (isEditMode) {
      // Caso de actualización
      const response = await graphqlRequest(UPDATE_PAYMENT_MUTATION, {
        id: parseInt(id!),
        input: transformToBackendFormat(formData)
      });

      if (response.updatePayment.success) {
        navigate('/payments');
      } else {
        alert(`Error: ${response.updatePayment.message}`);
      }
    } else if (formData.paymentType === 'CN') {
      // Caso de creación (pago al contado)
      const response = await graphqlRequest(CREATE_PAYMENT_MUTATION, {
        input: transformToBackendFormat(formData)
      });

      if (response.createPayment.success) {
        navigate('/payments');
      } else {
        alert(`Error: ${response.createPayment.message}`);
      }
    } else {
      // Caso de creación (pago a crédito - múltiples cuotas)
      for (const installment of formData.installments) {
        // Para cada cuota, usar la fecha seleccionada pero con la hora actual
        const installmentDate = new Date(installment.paymentDate);
        installmentDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        const installmentDateTimeString = formatLocalDateTime(installmentDate);
        await graphqlRequest(CREATE_PAYMENT_MUTATION, {
          input: {
            type: formData.type,
            paymentType: formData.paymentType,
            paymentMethod: formData.paymentMethod,
            status: installment.status,
            notes: `${formData.notes} - Cuota ${formData.installments.indexOf(installment) + 1}/${formData.installments.length}`,
            paymentDate: installmentDateTimeString,
            totalAmount: installment.amount,
            paidAmount: installment.status === 'C' ? installment.amount : 0,
            userId: parseInt(user?.id || '0'),
            companyId: parseInt(company?.id || '0')
          }
        });
      }
      navigate('/payments');
    }
  } catch (error) {
    console.error('Error al guardar movimiento:', error);
    alert('Error al procesar el movimiento');
  } finally {
    setProcessing(false);
  }
}
const formatLocalDateTime = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
  // =============================================
  // RENDERIZADO
  // =============================================
  if (loading) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando movimiento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col font-['Inter',_'system-ui',_sans-serif]">
      {/* Header Ultra Moderno */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/payments')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </h1>
              <p className="text-xs text-slate-300 leading-tight">
                {isEditMode ? `Editando movimiento #${id}` : 'Registra un ingreso o egreso'}
              </p>
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

      {/* Indicador de progreso */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {['type', 'method', 'amount', formData.paymentType === 'CR' && !isEditMode ? 'installments' : null, 'notes']
            .filter(Boolean)
            .map((section, index, array) => (
              <div key={section} className="flex items-center">
                <div className={`flex items-center ${
                  activeSection === section ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeSection === section 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="ml-2 text-xs font-medium hidden sm:inline">
                    {section === 'type' && 'Tipo'}
                    {section === 'method' && 'Método'}
                    {section === 'amount' && 'Monto'}
                    {section === 'installments' && 'Cuotas'}
                    {section === 'notes' && 'Descripción'}
                  </span>
                </div>
                {index < array.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                )}
              </div>
          ))}
        </div>
      </div>

      {/* Formulario Principal */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* SECCIÓN 1: Tipo de Movimiento */}
          <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
            activeSection === 'type' ? 'border-blue-500' : 'border-slate-200'
          }`}>
            <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">1</span>
              Tipo de Movimiento {isEditMode && '(No editable)'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                ref={typeIngresoRef}
                onClick={() => {
                  if (!isEditMode) {
                    setFormData({ ...formData, type: 'I' })
                    methodRefs.current[0]?.focus()
                    setActiveSection('method')
                  }
                }}
                disabled={isEditMode}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditMode) {
                    e.preventDefault()
                    setFormData({ ...formData, type: 'I' })
                    methodRefs.current[0]?.focus()
                    setActiveSection('method')
                  } else if (e.key === 'ArrowRight' && !isEditMode) {
                    e.preventDefault()
                    typeEgresoRef.current?.focus()
                  }
                }}
                className={`py-6 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-3 ${
                  formData.type === 'I'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg ring-4 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <ArrowDownCircle className="w-8 h-8" />
                <div>
                  <span className="text-lg block">INGRESO</span>
                  <span className="text-xs opacity-80">Dinero que entra</span>
                </div>
              </button>

              <button
                ref={typeEgresoRef}
                onClick={() => {
                  if (!isEditMode) {
                    setFormData({ ...formData, type: 'E' })
                    methodRefs.current[0]?.focus()
                    setActiveSection('method')
                  }
                }}
                disabled={isEditMode}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditMode) {
                    e.preventDefault()
                    setFormData({ ...formData, type: 'E' })
                    methodRefs.current[0]?.focus()
                    setActiveSection('method')
                  } else if (e.key === 'ArrowLeft' && !isEditMode) {
                    e.preventDefault()
                    typeIngresoRef.current?.focus()
                  }
                }}
                className={`py-6 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-3 ${
                  formData.type === 'E'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg ring-4 ring-red-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <ArrowUpCircle className="w-8 h-8" />
                <div>
                  <span className="text-lg block">EGRESO</span>
                  <span className="text-xs opacity-80">Dinero que sale</span>
                </div>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              {!isEditMode && (
                <>
                  Usa <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">←</kbd> 
                  <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs mx-1">→</kbd> para navegar, 
                  <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs ml-1">Enter</kbd> para seleccionar
                </>
              )}
            </p>
          </div>

          {/* SECCIÓN 2: Forma y Método de Pago */}
          <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
            activeSection === 'method' ? 'border-blue-500' : 'border-slate-200'
          }`}>
            <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">2</span>
              Forma y Método de Pago {isEditMode && '(No editable)'}
            </h3>
            
            {/* Forma de Pago */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Forma de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !isEditMode && handlePaymentTypeChange('CN')}
                  disabled={isEditMode}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !isEditMode) {
                      e.preventDefault()
                      methodRefs.current[0]?.focus()
                    }
                  }}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    formData.paymentType === 'CN'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Contado
                </button>

                <button
                  onClick={() => !isEditMode && handlePaymentTypeChange('CR')}
                  disabled={isEditMode}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !isEditMode) {
                      e.preventDefault()
                      methodRefs.current[0]?.focus()
                    }
                  }}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    formData.paymentType === 'CR'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Crédito
                </button>
              </div>
            </div>

            {/* Método de Pago */}
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-5 gap-3">
              {[
                { id: 'E', name: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
                { id: 'Y', name: 'Yape', icon: <Smartphone className="w-5 h-5" /> },
                { id: 'P', name: 'Plin', icon: <Smartphone className="w-5 h-5" /> },
                { id: 'T', name: 'Tarjeta', icon: <CreditCard className="w-5 h-5" /> },
                { id: 'B', name: 'Transfer', icon: <Building2 className="w-5 h-5" /> }
              ].map((method, index) => (
                <button
                  key={method.id}
                  ref={el => methodRefs.current[index] = el}
                  onClick={() => {
                    if (!isEditMode) {
                      setFormData({ ...formData, paymentMethod: method.id as any })
                      amountRef.current?.focus()
                      setActiveSection('amount')
                    }
                  }}
                  disabled={isEditMode}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isEditMode) {
                      e.preventDefault()
                      setFormData({ ...formData, paymentMethod: method.id as any })
                      amountRef.current?.focus()
                      setActiveSection('amount')
                    } else if (e.key === 'ArrowRight' && index < 4 && !isEditMode) {
                      e.preventDefault()
                      methodRefs.current[index + 1]?.focus()
                    } else if (e.key === 'ArrowLeft' && index > 0 && !isEditMode) {
                      e.preventDefault()
                      methodRefs.current[index - 1]?.focus()
                    }
                  }}
                  className={`py-4 px-2 rounded-lg font-medium transition-all flex flex-col items-center space-y-2 ${
                    formData.paymentMethod === method.id
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg ring-4 ring-slate-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {method.icon}
                  <span className="text-xs">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN 3: Monto y Fecha */}
          <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
            activeSection === 'amount' ? 'border-blue-500' : 'border-slate-200'
          }`}>
            <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">3</span>
              Monto y Fecha
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Monto */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Monto Total</label>
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
                        if (formData.paymentType === 'CR' && !isEditMode) {
                          setShowInstallmentForm(true)
                          setTimeout(() => installmentAmountRef.current?.focus(), 100)
                          setActiveSection('installments')
                        } else {
                          notesRef.current?.focus()
                          setActiveSection('notes')
                        }
                      } else if (e.key === 'Tab') {
                        e.preventDefault()
                        dateRef.current?.focus()
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-4 py-4 text-2xl font-mono font-bold text-center rounded-lg border-2 ${
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
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">
                  Fecha {formData.paymentType === 'CN' ? 'del Movimiento' : 'de Registro'}
                </label>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <input
                    ref={dateRef}
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (formData.paymentType === 'CR' && !isEditMode) {
                          setShowInstallmentForm(true)
                          setTimeout(() => installmentAmountRef.current?.focus(), 100)
                          setActiveSection('installments')
                        } else {
                          notesRef.current?.focus()
                          setActiveSection('notes')
                        }
                      }
                    }}
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
                    Se registrará con la hora exacta: {new Date().toLocaleTimeString('es-PE', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true 
                    })}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Cuotas (Solo para Crédito y no en edición) */}
          {formData.paymentType === 'CR' && !isEditMode && (
            <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
              activeSection === 'installments' ? 'border-blue-500' : 'border-slate-200'
            }`}>
              <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">4</span>
                  Cuotas del Crédito
                </div>
                <div className="text-sm font-normal">
                  Total: {formatCurrency(formData.totalAmount)} | 
                  Asignado: {formatCurrency(formData.installments.reduce((sum, i) => sum + i.amount, 0))} | 
                  Restante: {formatCurrency(formData.totalAmount - formData.installments.reduce((sum, i) => sum + i.amount, 0))}
                </div>
              </h3>

              {errors.installments && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{errors.installments}</span>
                </div>
              )}

              {/* Opciones rápidas */}
              <div className="mb-4 flex items-center space-x-2">
                <span className="text-xs text-slate-600">Generar cuotas:</span>
                {[2, 3, 4, 6, 12].map(num => (
                  <button
                    key={num}
                    onClick={() => generateInstallments(num)}
                    className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium"
                  >
                    {num} cuotas
                  </button>
                ))}
              </div>

              {/* Lista de cuotas */}
              {formData.installments.length > 0 && (
                <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                  {formData.installments.map((installment, index) => (
                    <div
                      key={installment.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Cuota {index + 1}
                        </span>
                        <span className="text-sm text-slate-600">
                          {new Date(installment.paymentDate).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-sm">{formatCurrency(installment.amount)}</span>
                        <button
                          onClick={() => removeInstallment(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar cuota */}
              {showInstallmentForm ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Monto de la cuota</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-500">S/</span>
                        <input
                          ref={installmentAmountRef}
                          type="text"
                          inputMode="decimal"
                          value={installmentAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            const parts = value.split('.')
                            if (parts.length > 2) return
                            if (parts[1] && parts[1].length > 2) return
                            setInstallmentAmount(value)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addInstallment()
                            } else if (e.key === 'Tab') {
                              e.preventDefault()
                              installmentDateRef.current?.focus()
                            } else if (e.key === 'Escape') {
                              setShowInstallmentForm(false)
                              setInstallmentAmount('')
                            }
                          }}
                          placeholder={`Máx: ${formatCurrency(formData.totalAmount - formData.installments.reduce((sum, i) => sum + i.amount, 0))}`}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Fecha de pago</label>
                      <input
                        ref={installmentDateRef}
                        type="date"
                        value={installmentDate}
                        onChange={(e) => setInstallmentDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addInstallment()
                          }
                        }}
                        min={new Date().toISOString().slice(0, 10)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setShowInstallmentForm(false)
                        setInstallmentAmount('')
                      }}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancelar (ESC)
                    </button>
                    <button
                      onClick={addInstallment}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar (Enter)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowInstallmentForm(true)
                    const remaining = formData.totalAmount - formData.installments.reduce((sum, i) => sum + i.amount, 0)
                    setInstallmentAmount(remaining.toFixed(2))
                    setTimeout(() => installmentDateRef.current?.focus(), 100)
                  }}
                  disabled={formData.totalAmount - formData.installments.reduce((sum, i) => sum + i.amount, 0) <= 0}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Agregar Cuota</span>
                </button>
              )}

              {/* Botón para continuar */}
              {formData.installments.length > 0 && (
                <button
                  onClick={() => {
                    notesRef.current?.focus()
                    setActiveSection('notes')
                  }}
                  className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          )}

          {/* SECCIÓN 5: Descripción */}
          <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
            activeSection === 'notes' ? 'border-blue-500' : 'border-slate-200'
          }`}>
            <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                {formData.paymentType === 'CR' && !isEditMode ? '5' : '4'}
              </span>
              Descripción del Movimiento
            </h3>
            <textarea
              ref={notesRef}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'F12' || (e.key === 'Enter' && e.ctrlKey)) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={formData.type === 'I' 
                ? "Ej: PAGO DE CLIENTE JUAN PÉREZ, VENTA DEL DÍA, OTROS INGRESOS..." 
                : "Ej: PAGO A PROVEEDOR ABC, GASTOS DE OFICINA, SERVICIOS BÁSICOS..."
              }
              rows={4}
              className={`w-full px-4 py-3 text-sm border rounded-lg resize-none ${
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

          {/* Resumen Final */}
          <div className={`rounded-lg p-6 border-2 ${
            formData.type === 'I' 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="text-sm font-bold mb-4 text-slate-700 tracking-tight flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Resumen del Movimiento
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-600">Forma:</span>
                 <span className="font-medium text-sm text-slate-900">
                   {formData.paymentType === 'CN' ? 'Contado' : 'Crédito'}
                 </span>
               </div>
             </div>
             
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-600">Fecha:</span>
                 <span className="font-medium text-sm text-slate-900">
                   {new Date(formData.paymentDate).toLocaleDateString('es-PE')}
                 </span>
               </div>
               {formData.paymentType === 'CR' && !isEditMode && (
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600">Cuotas:</span>
                   <span className="font-medium text-sm text-slate-900">
                     {formData.installments.length}
                   </span>
                 </div>
               )}
               <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                 <span className="text-sm font-semibold text-slate-700">Total:</span>
                 <span className={`text-xl font-bold font-mono ${
                   formData.type === 'I' ? 'text-emerald-600' : 'text-red-600'
                 }`}>
                   {formData.type === 'I' ? '+' : '-'} {formatCurrency(formData.totalAmount)}
                 </span>
               </div>
             </div>
           </div>
         </div>

         {/* Botones de Acción */}
         <div className="flex space-x-4">
           <button
             onClick={() => navigate('/payments')}
             disabled={processing}
             className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all text-sm"
           >
             Cancelar (ESC)
           </button>
           <button
             onClick={handleSubmit}
             disabled={processing || !formData.totalAmount || !formData.notes.trim()}
             className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${
               processing || !formData.totalAmount || !formData.notes.trim()
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
                 {isEditMode ? 'Actualizar' : 'Registrar'} Movimiento (F12)
               </>
             )}
           </button>
         </div>

         {/* Indicador de atajos */}
         <div className="text-center">
           <p className="text-xs text-slate-500">
             <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">F12</kbd> o{' '}
             <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">Ctrl+S</kbd> para guardar • {' '}
             <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">ESC</kbd> para cancelar • {' '}
             <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">Enter</kbd> para avanzar
           </p>
         </div>
       </div>
     </div>
   </div>
 )
}