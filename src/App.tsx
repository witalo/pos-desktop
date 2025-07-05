// src/App.tsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Páginas
import CompanyLoginPage from './pages/auth/CompanyLoginPage'
import UserLoginPage from './pages/auth/UserLoginPage'
import HomePage from './pages/home/HomePage'
import POSPage from './pages/sales/POSPage'
import InventoryPage from './pages/inventory/InventoryPage'
import CustomersPage from './pages/customers/CustomersPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

// Layout
import MainLayout from './components/layout/MainLayout'

function App() {
  const [loading, setLoading] = useState(true)
  const { checkStoredCompany, isCompanyStored, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Verificar si hay empresa almacenada al iniciar
    const initApp = async () => {
      await checkStoredCompany()
      setLoading(false)
    }
    initApp()
  }, [checkStoredCompany])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de autenticación */}
        <Route path="/company-login" element={
          isCompanyStored ? <Navigate to="/login" /> : <CompanyLoginPage />
        } />
        
        <Route path="/login" element={
          !isCompanyStored ? (
            <Navigate to="/company-login" />
          ) : isAuthenticated ? (
            <Navigate to="/" />
          ) : (
            <UserLoginPage />
          )
        } />

        {/* Rutas protegidas */}
        <Route element={
          !isAuthenticated ? (
            <Navigate to={isCompanyStored ? "/login" : "/company-login"} />
          ) : (
            <MainLayout />
          )
        }>
          <Route path="/" element={<HomePage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={
          <Navigate to={
            !isCompanyStored ? "/company-login" : 
            !isAuthenticated ? "/login" : 
            "/"
          } />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App