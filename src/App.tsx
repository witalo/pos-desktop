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
          
          {/* Otras rutas futuras */}
          <Route path="purchases" element={<div className="p-8"><h1 className="text-2xl font-bold">Compras - En desarrollo</h1></div>} />
          <Route path="inventory" element={<div className="p-8"><h1 className="text-2xl font-bold">Inventario - En desarrollo</h1></div>} />
          <Route path="reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Reportes - En desarrollo</h1></div>} />
          <Route path="customers" element={<div className="p-8"><h1 className="text-2xl font-bold">Clientes - En desarrollo</h1></div>} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}


// import { useEffect, useState } from 'react'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { useAuthStore } from './store/authStore'

// // Páginas
// import CompanyLoginPage from './pages/auth/CompanyLoginPage'
// import UserLoginPage from './pages/auth/UserLoginPage'
// import HomePage from './pages/home/HomePage'
// import POSPage from './pages/sales/POSPage'
// import InventoryPage from './pages/inventory/InventoryPage'
// import CustomersPage from './pages/customers/CustomersPage'
// import ReportsPage from './pages/reports/ReportsPage'
// import SettingsPage from './pages/settings/SettingsPage'

// // Layout
// import MainLayout from './components/layout/MainLayout'

// function App() {
//   const [loading, setLoading] = useState(true)
//   const { checkStoredCompany, isCompanyStored, isAuthenticated } = useAuthStore()

//   useEffect(() => {
//     // Verificar si hay empresa almacenada al iniciar
//     const initApp = async () => {
//       await checkStoredCompany()
//       setLoading(false)
//     }
//     initApp()
//   }, [checkStoredCompany])

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     )
//   }

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Rutas de autenticación */}
//         <Route path="/company-login" element={
//           isCompanyStored ? <Navigate to="/login" /> : <CompanyLoginPage />
//         } />
        
//         <Route path="/login" element={
//           !isCompanyStored ? (
//             <Navigate to="/company-login" />
//           ) : isAuthenticated ? (
//             <Navigate to="/" />
//           ) : (
//             <UserLoginPage />
//           )
//         } />

//         {/* Rutas protegidas */}
//         <Route element={
//           !isAuthenticated ? (
//             <Navigate to={isCompanyStored ? "/login" : "/company-login"} />
//           ) : (
//             <MainLayout />
//           )
//         }>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/pos" element={<POSPage />} />
//           <Route path="/inventory" element={<InventoryPage />} />
//           <Route path="/customers" element={<CustomersPage />} />
//           <Route path="/reports" element={<ReportsPage />} />
//           <Route path="/settings" element={<SettingsPage />} />
//         </Route>

//         {/* Redirección por defecto */}
//         <Route path="*" element={
//           <Navigate to={
//             !isCompanyStored ? "/company-login" : 
//             !isAuthenticated ? "/login" : 
//             "/"
//           } />
//         } />
//       </Routes>
//     </BrowserRouter>
//   )
// }

// export default App