// src/pages/auth/CompanyLoginPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { companyLogin } from '../../services/graphql'

export default function CompanyLoginPage() {
  const navigate = useNavigate()
  const { setCompany } = useAuthStore()
  
  const [formData, setFormData] = useState({
    ruc: '',
    email: '',
    password: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Referencias para navegación con Enter
  const rucRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    rucRef.current?.focus()
  }, [])

  // Manejar navegación con Enter
  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef.current) {
        nextRef.current.focus()
      }
    }
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.ruc || formData.ruc.length !== 11) {
      newErrors.ruc = 'RUC debe tener 11 dígitos'
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Email inválido'
    }
    
    if (!formData.password || formData.password.length < 4) {
      newErrors.password = 'Contraseña debe tener al menos 4 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!validateForm()) {
      setNotification({ 
        type: 'error', 
        message: 'Por favor corrija los errores' 
      })
      return
    }

    setLoading(true)
    setNotification(null)

    try {
      const response = await companyLogin(
        formData.ruc,
        formData.email,
        formData.password
      )

      if (response.success && response.company) {
        setNotification({ 
          type: 'success', 
          message: response.message 
        })
        
        // Guardar datos de empresa
        setCompany({
          ...response.company,
          logoBase64: response.logoBase64
        })
        
        // Guardar en electron si está disponible
        if (window.electronAPI) {
          await window.electronAPI.saveCompanyData({
            company: response.company,
            logo: response.logoBase64
          })
        }
        
        // Navegar al login de usuario
        setTimeout(() => {
          navigate('/login')
        }, 1000)
      } else {
        setErrors({ general: response.errors?.join(', ') || response.message })
        setNotification({ 
          type: 'error', 
          message: response.message 
        })
      }
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: 'Error de conexión. Verifique que el servidor esté activo.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Punto de Venta
            </h1>
            <p className="text-gray-600">Ingrese los datos de su empresa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* RUC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUC
              </label>
              <input
                ref={rucRef}
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  ruc: e.target.value.replace(/\D/g, '').slice(0, 11) 
                })}
                onKeyDown={(e) => handleKeyDown(e, emailRef)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.ruc ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="Ingrese RUC de 11 dígitos"
                maxLength={11}
                autoFocus
              />
              {errors.ruc && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ruc}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="empresa@ejemplo.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Contraseña
              </label>
              <input
                ref={passwordRef}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Botón submit */}
            <button
              ref={submitRef}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Presione <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> para navegar entre campos
            </p>
          </div>
        </div>

        {/* Notificación */}
        {notification && (
          <div className={`mt-4 p-4 rounded-lg text-white text-center ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  )
}