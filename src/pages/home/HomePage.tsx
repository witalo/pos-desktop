// src/pages/home/HomePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
  LogOut,
  User,
  Settings,
  Home,
  ShoppingBag,
  FileBarChart,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
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

  // Datos de ejemplo para las cards
  const stats = [
    {
      title: 'Ventas del Día',
      value: 'S/. 12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Productos Vendidos',
      value: '245',
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Clientes Nuevos',
      value: '18',
      change: '-2.4%',
      trend: 'down',
      icon: Users,
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Ganancias del Mes',
      value: 'S/. 85,320',
      change: '+18.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  const menuItems = [
    { 
      id: 'home', 
      label: 'Inicio', 
      icon: Home, 
      path: '/',
      active: true 
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: ShoppingCart, 
      path: '/pos',
      shortcut: 'F1' 
    },
    { 
      id: 'purchases', 
      label: 'Compras', 
      icon: ShoppingBag, 
      path: '/purchases',
      shortcut: 'F2' 
    },
    { 
      id: 'products', 
      label: 'Productos', 
      icon: Package, 
      path: '/inventory',
      shortcut: 'F3' 
    },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: FileBarChart, 
      path: '/reports',
      shortcut: 'F4' 
    }
  ]

  const quickActions = [
    { 
      title: 'Nueva Venta', 
      icon: ShoppingCart, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      action: () => navigate('/pos')
    },
    { 
      title: 'Agregar Producto', 
      icon: Package, 
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      action: () => navigate('/inventory')
    },
    { 
      title: 'Reporte Diario', 
      icon: FileText, 
      color: 'bg-gradient-to-r from-pink-500 to-pink-600',
      action: () => navigate('/reports')
    },
    { 
      title: 'Clientes', 
      icon: Users, 
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      action: () => navigate('/customers')
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-xl transition-all duration-300 flex flex-col`}>
        {/* Header con logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {company?.name?.[0] || 'P'}
                </div>
              )}
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h2 className="font-bold text-gray-900 truncate">{company?.name}</h2>
                  <p className="text-xs text-gray-500">RUC: {company?.ruc}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu de navegación */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      {item.shortcut && (
                        <kbd className={`text-xs px-1.5 py-0.5 rounded ${
                          item.active 
                            ? 'bg-white/20 text-white/80' 
                            : 'bg-gray-100 text-gray-500'
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
        <div className="border-t border-gray-200 p-4">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                {/* <p className="text-xs text-gray-500">{user?.role}</p> */}
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {user?.firstName} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Resumen de tu negocio • {currentTime.toLocaleDateString('es-PE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-gray-500">Hora Local</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>{stat.change}</span>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative overflow-hidden bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`absolute inset-0 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <action.icon className="w-8 h-8 text-gray-700 group-hover:text-white mb-3 mx-auto transition-colors" />
                    <p className="text-sm font-medium text-gray-700 group-hover:text-white transition-colors">
                      {action.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Ventas Recientes</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">Venta #000{i}</p>
                        <p className="text-sm text-gray-500">Cliente {i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">S/. {(Math.random() * 1000).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Hace {i * 5} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Actividad Semanal</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <p className="text-gray-500">Gráfico de actividad</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
