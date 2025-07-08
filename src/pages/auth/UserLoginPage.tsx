// src/pages/auth/UserLoginPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, AlertCircle, Loader2, Building2, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { userLogin } from '../../services/graphql'

export default function UserLoginPage() {
  const navigate = useNavigate()
  const { company, setUser, clearCompany } = useAuthStore()
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Referencias para navegación con Enter
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  // Si no hay empresa, redirigir
  useEffect(() => {
    if (!company) {
      navigate('/company-login')
    }
  }, [company, navigate])

  // Manejar navegación con Enter
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        handleSubmit()
      }
    }
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Usuario/email requerido (mínimo 3 caracteres)'
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
    
    if (!validateForm() || !company) {
      setNotification({ 
        type: 'error', 
        message: 'Por favor corrija los errores' 
      })
      return
    }

    setLoading(true)
    setNotification(null)

    try {
      const response = await userLogin(
        formData.username,
        formData.password,
        company.id
      )

      if (response.success && response.user && response.token) {
        setNotification({ 
          type: 'success', 
          message: response.message 
        })
        
        // Guardar datos de usuario y token
        setUser(response.user, response.token)
        
        // Guardar tokens en localStorage
        localStorage.setItem('token', response.token)
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken)
        }
        
        // Navegar al dashboard
        setTimeout(() => {
          navigate('/')
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

  // Cambiar de empresa
  const handleChangeCompany = async () => {
    await clearCompany()
    navigate('/company-login')
  }

  if (!company) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header con info de empresa */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              {company.logoBase64 ? (
                <img 
                  src={company.logoBase64} 
                  alt={company.denomination}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {company.denomination}
            </h2>
            <p className="text-sm text-gray-600 mb-1">RUC: {company.ruc}</p>
            <button
              onClick={handleChangeCompany}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Cambiar empresa
            </button>
          </div>

          <h1 className="text-xl font-semibold text-center text-gray-800 mb-6">
            Iniciar Sesión
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Usuario/Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Usuario o Email
              </label>
              <input
                ref={usernameRef}
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="usuario o correo@ejemplo.com"
                autoFocus
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
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
                onKeyDown={(e) => handleKeyDown(e)}
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
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Presione <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> para iniciar sesión
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