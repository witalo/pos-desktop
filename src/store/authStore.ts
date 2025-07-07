// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Company {
  id: string
  denomination: string
  ruc: string
  email: string
  logo?: string
  logoBase64?: string
  igvPercentage?: number | 18
  pdfSize?: string       
  pdfColor?: string     
}

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
}

interface AuthState {
  // Estado
  company: Company | null
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isCompanyStored: boolean
  
  // Actions
  setCompany: (company: Company) => void
  setUser: (user: User, token: string) => void
  logout: () => void
  clearCompany: () => Promise<void>
  checkStoredCompany: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      company: null,
      user: null,
      token: null,
      isAuthenticated: false,
      isCompanyStored: false,

      // Establecer empresa
      setCompany: (company) => {
        set({
          company,
          isCompanyStored: true,
        })
        
        // Guardar en electron si está disponible
        if (window.electronAPI?.saveCompanyData) {
          window.electronAPI.saveCompanyData({ company })
        }
      },

      // Establecer usuario
      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      // Cerrar sesión de usuario (mantiene empresa)
      logout: () => {
        const { company, isCompanyStored } = get()
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          // Mantener empresa si está almacenada
          company: isCompanyStored ? company : null,
        })

        // Limpiar tokens del localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      },

      // Limpiar empresa (reset completo)
      clearCompany: async () => {
        set({
          company: null,
          user: null,
          token: null,
          isAuthenticated: false,
          isCompanyStored: false,
        })

        // Limpiar almacenamiento de Electron
        if (window.electronAPI?.clearCompanyData) {
          await window.electronAPI.clearCompanyData()
        }

        // Limpiar tokens
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      },

      // Verificar empresa almacenada
      checkStoredCompany: async () => {
        // Primero verificar estado actual
        const { company } = get()
        if (company) {
          return true
        }
        
        // Luego verificar en electron storage si existe
        if (window.electronAPI?.getCompanyData) {
          try {
            const storedData = await window.electronAPI.getCompanyData()
            if (storedData?.company) {
              set({
                company: storedData.company,
                isCompanyStored: true,
              })
              return true
            }
          } catch (error) {
            console.error('Error loading company data:', error)
          }
        }
        
        return false
      },
    }),
    {
      name: 'pos-auth-storage',
      partialize: (state) => ({
        company: state.company,
        isCompanyStored: state.isCompanyStored,
        // No persistir tokens por seguridad
      }),
    }
  )
)