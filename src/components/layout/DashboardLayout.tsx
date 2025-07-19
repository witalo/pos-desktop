// src/components/layout/DashboardLayout.tsx - Versión corregida y mejorada
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  ShoppingCart,
  Package,
  LogOut,
  Settings,
  Home,
  ShoppingBag,
  FileBarChart,
  Menu,
  X,
  Clock
} from 'lucide-react'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { company, user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { 
      id: 'home', 
      label: 'Inicio', 
      icon: Home, 
      path: '/',
      active: location.pathname === '/'
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: ShoppingCart, 
      path: '/sales',
      shortcut: 'F1',
      active: location.pathname === '/sales' || location.pathname === '/pos'
    },
   { 
      id: 'purchases', 
      label: 'Compras', 
      icon: ShoppingBag, 
      path: '/purchases',
      shortcut: 'F2',
      active: location.pathname === '/purchases' || location.pathname === '/purchase'
    },
    { 
      id: 'products', 
      label: 'Productos', 
      icon: Package, 
      path: '/products',
      shortcut: 'F3',
      active: location.pathname === '/products' || 
            location.pathname === '/product' ||
            location.pathname.startsWith('/product/')
    },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: FileBarChart, 
      path: '/reports',
      shortcut: 'F4',
      active: location.pathname === '/reports'
    }
  ]

  // Función para obtener el título de la página
  function getPageTitle() {
    switch (location.pathname) {
      case '/':
        return `Bienvenido, ${user?.firstName} 👋`
      case '/sales':
        return 'Lista de Ventas'
      case '/pos':
        return 'Punto de Venta'
      case '/purchases':
        return 'Compras'
      case '/purchase':
        return 'Compra'
      case '/inventory':
        return 'Inventario de Productos'
      case '/reports':
        return 'Reportes y Análisis'
      case '/customers':
        return 'Gestión de Clientes'
      default:
        return 'Panel de Control'
    }
  }

  // Función para obtener el subtítulo de la página
  function getPageSubtitle() {
    const dateString = currentTime.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    switch (location.pathname) {
      case '/':
        return `Resumen de tu negocio • ${dateString}`
      case '/sales':
        return 'Gestiona y consulta todas tus ventas realizadas'
      case '/pos':
        return 'Registra nuevas ventas de manera rápida y eficiente'
      case '/purchases':
        return 'Control de compras y proveedores'
      case '/purchase':
        return 'Registra nuevas compras de manera rapida y eficiente'
      case '/products':
        return 'Administra tu catálogo de productos'
      case '/product':
        return 'Administra producto'
      case '/reports':
        return 'Análisis y estadísticas de tu negocio'
      case '/customers':
        return 'Base de datos de clientes y proveedores'
      default:
        return `${company?.denomination} • ${dateString}`
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 font-['Inter',_'system-ui',_sans-serif]">
      {/* Sidebar Mejorado */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-xl transition-all duration-300 flex flex-col z-30 border-r border-slate-200`}>
        
        {/* Header con logo */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              {company?.logoBase64 ? (
                <img 
                  src={company.logoBase64}
                  alt={company.denomination}
                  className="w-10 h-10 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                  {company?.denomination?.[0] || 'P'}
                </div>
              )}
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h2 className="font-bold text-slate-900 truncate tracking-tight text-sm">
                    {company?.denomination}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    RUC: {company?.ruc}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Menu de navegación */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all font-medium tracking-tight text-sm ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <kbd className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          item.active 
                            ? 'bg-white/20 text-white/80' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.shortcut}
                        </kbd>
                      )}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info - Parte inferior */}
        <div className="border-t border-slate-200 p-4">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 tracking-tight truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500">En línea</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Solo para páginas que no sean POS */}
        {location.pathname !== '/pos' && (
          <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="px-6 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-600 mt-0.5 tracking-tight">
                  {getPageSubtitle()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 font-mono">
                    {currentTime.toLocaleTimeString('es-PE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1" />
                    Hora Local
                  </p>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={`flex-1 overflow-hidden ${location.pathname === '/pos' ? '' : 'bg-slate-50'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}