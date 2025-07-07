// src/pages/home/HomePage.tsx - Versión con tipografía moderna
import { useNavigate } from 'react-router-dom'
import {
  Package,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  ShoppingCart,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()

  // Datos de ejemplo para las cards
  const stats = [
    {
      title: 'Ventas del Día',
      value: 'S/. 12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-blue-600 to-blue-700'
    },
    {
      title: 'Productos Vendidos',
      value: '245',
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'from-purple-600 to-purple-700'
    },
    {
      title: 'Clientes Nuevos',
      value: '18',
      change: '-2.4%',
      trend: 'down',
      icon: Users,
      color: 'from-pink-600 to-pink-700'
    },
    {
      title: 'Ganancias del Mes',
      value: 'S/. 85,320',
      change: '+18.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-emerald-600 to-emerald-700'
    }
  ]

  const quickActions = [
    { 
      title: 'Nueva Venta', 
      icon: ShoppingCart, 
      color: 'bg-gradient-to-r from-blue-600 to-blue-700',
      action: () => navigate('/pos')
    },
    { 
      title: 'Ver Ventas', 
      icon: FileText, 
      color: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
      action: () => navigate('/sales')
    },
    { 
      title: 'Agregar Producto', 
      icon: Package, 
      color: 'bg-gradient-to-r from-purple-600 to-purple-700',
      action: () => navigate('/inventory')
    },
    { 
      title: 'Reportes', 
      icon: BarChart3, 
      color: 'bg-gradient-to-r from-orange-600 to-orange-700',
      action: () => navigate('/reports')
    }
  ]

  return (
    <div className="p-6 space-y-6 font-['Inter',_'system-ui',_sans-serif]">
      {/* Stats Cards Compactas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-105 transition-transform shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-semibold ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  <span className="tracking-tight">{stat.change}</span>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium tracking-tight">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight font-mono">{stat.value}</p>
            </div>
            <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-300"
            >
              <div className={`absolute inset-0 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10">
                <action.icon className="w-7 h-7 text-slate-700 group-hover:text-white mb-3 mx-auto transition-colors" />
                <p className="text-sm font-semibold text-slate-700 group-hover:text-white transition-colors tracking-tight">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Ventas Recientes</h3>
            <button 
              onClick={() => navigate('/sales')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center tracking-tight"
            >
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">Venta #000{i}</p>
                    <p className="text-xs text-slate-500">Cliente {i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 text-sm font-mono">S/. {(Math.random() * 1000).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Hace {i * 5} min</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Actividad Semanal</h3>
            <button 
              onClick={() => navigate('/reports')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
          <div className="h-52 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-sm tracking-tight">Gráfico de actividad</p>
              <p className="text-xs text-slate-400 mt-1">Los datos se mostrarán aquí</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Resumen Semanal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <DollarSign className="w-7 h-7 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600 font-mono tracking-tight">S/. 45,280</p>
            <p className="text-sm text-slate-600 font-medium tracking-tight">Ventas esta semana</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
            <ShoppingCart className="w-7 h-7 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">127</p>
            <p className="text-sm text-slate-600 font-medium tracking-tight">Transacciones</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <TrendingUp className="w-7 h-7 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600 font-mono tracking-tight">+23%</p>
            <p className="text-sm text-slate-600 font-medium tracking-tight">Crecimiento</p>
          </div>
        </div>
      </div>
    </div>
  )
}
