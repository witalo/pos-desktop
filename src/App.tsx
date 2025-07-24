// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

// Páginas de autenticación
import CompanyLoginPage from './pages/auth/CompanyLoginPage'
import UserLoginPage from './pages/auth/UserLoginPage'

// Layout principal
import DashboardLayout from './components/layout/DashboardLayout'

// Páginas principales
import HomePage from './pages/home/HomePage'
import POSPage from './pages/sales/POSPage'
import SalesListPage from './pages/sales/SalesListPage'
import PurchaseListPage from './pages/purchases/PurchaseListPage'
import PurchasePage from './pages/purchases/PurchasePage'
import ProductListPage from './pages/products/ProductListPage'
import ProductPage from './pages/products/ProductPage'
import PaymentListPage from './pages/payments/PaymentListPage'
import PaymentPage from './pages/payments/PaymentPage'
import ReportPage from './pages/reports/ReportsPage'

// Componente de protección de rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Componente de verificación de empresa
function CompanyRoute({ children }: { children: React.ReactNode }) {
  const { company, checkStoredCompany } = useAuthStore()
  
  useEffect(() => {
    checkStoredCompany()
  }, [checkStoredCompany])
  
  if (!company) {
    return <Navigate to="/company-login" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta de login de empresa */}
        <Route path="/company-login" element={<CompanyLoginPage />} />
        
        {/* Ruta de login de usuario */}
        <Route path="/login" element={
          <CompanyRoute>
            <UserLoginPage />
          </CompanyRoute>
        } />
        
        {/* Rutas principales protegidas */}
        <Route path="/" element={
          <CompanyRoute>
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          </CompanyRoute>
        }>
          {/* Dashboard principal */}
          <Route index element={<HomePage />} />
          
          {/* Ventas */}
          <Route path="sales" element={<SalesListPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="purchases" element={<PurchaseListPage />} />
          <Route path="purchase" element={<PurchasePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="product" element={<ProductPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="/payments" element={<PaymentListPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="payment/:id" element={<PaymentPage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="customers" element={<div className="p-8"><h1 className="text-2xl font-bold">Clientes - En desarrollo</h1></div>} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}