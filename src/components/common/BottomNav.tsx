import React from 'react'
import { LayoutDashboard, CalendarCheck, CheckSquare, Bell, Menu } from 'lucide-react'

export type NavTab = 'dashboard' | 'my_day' | 'tasks' | 'alerts' | 'more'

interface BottomNavProps {
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  unreadCount?: number
  urgentCount?: number
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 0,
  urgentCount = 0
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E8E2D9] px-2 py-1.5 pb-safe shadow-lg"
      aria-label="Navegación inferior móvil"
    >
      <div className="flex items-center justify-around">
        {/* 1. Inicio / Dashboard */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'dashboard' ? 'text-[#C92A2A] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label="Inicio"
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {urgentCount > 0 && currentTab !== 'dashboard' && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-[#C92A2A] rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-1">Inicio</span>
        </button>

        {/* 2. Mi Día */}
        <button
          type="button"
          onClick={() => onTabChange('my_day')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'my_day' ? 'text-[#C92A2A] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label="Mi día"
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1">Mi Día</span>
        </button>

        {/* 3. Tareas */}
        <button
          type="button"
          onClick={() => onTabChange('tasks')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'tasks' ? 'text-[#C92A2A] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label="Tareas"
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1">Tareas</span>
        </button>

        {/* 4. Alertas / Notificaciones */}
        <button
          type="button"
          onClick={() => onTabChange('alerts')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative cursor-pointer ${
            currentTab === 'alerts' ? 'text-[#C92A2A] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label="Notificaciones"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-[#C92A2A] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Alertas</span>
        </button>

        {/* 5. Más */}
        <button
          type="button"
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'more' ? 'text-[#C92A2A] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label="Menú y opciones"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1">Más</span>
        </button>
      </div>
    </nav>
  )
}
