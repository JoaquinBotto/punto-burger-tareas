import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { formatHeaderDate } from '../../lib/dateUtils'
import {
  Flame,
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Bell,
  Users,
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Layers
} from 'lucide-react'

export type MainNavTab = 'dashboard' | 'my_day' | 'tasks'

interface HeaderProps {
  currentTab: MainNavTab
  onTabChange: (tab: MainNavTab) => void
  unreadAlertsCount?: number
  onOpenAlerts?: () => void
  onOpenTeam?: () => void
  onOpenAreas?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  unreadAlertsCount = 0,
  onOpenAlerts,
  onOpenTeam,
  onOpenAreas
}) => {
  const { profile, isAdmin, isResponsable, logout } = useAuth()
  const todayFormatted = formatHeaderDate()

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#C92A2A] border border-red-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </span>
      )
    }
    if (isResponsable) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Responsable</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
        <UserIcon className="w-3.5 h-3.5" />
        <span>Colaborador</span>
      </span>
    )
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#C92A2A] text-white shadow-md shadow-[#C92A2A]/20">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[#18181B] leading-none">
                  PUNTO BURGER
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#FAF0F0] text-[#C92A2A] rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                  Tareas
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                  v1.0.4
                </span>
              </div>
              <p className="text-xs text-[#71717A] font-medium hidden sm:block">
                {todayFormatted} • Córdoba, ARG
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-white text-[#C92A2A] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('my_day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'my_day'
                  ? 'bg-white text-[#C92A2A] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mi Día</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'tasks'
                  ? 'bg-white text-[#C92A2A] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tareas</span>
            </button>
          </nav>
        </div>

        {/* Right: Actions & User info */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Areas Manager (Admin only) */}
          {isAdmin && onOpenAreas && (
            <button
              type="button"
              onClick={onOpenAreas}
              className="p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer hidden lg:flex items-center gap-1.5 text-xs font-bold"
              title="Administrar Áreas"
            >
              <Layers className="w-4 h-4 text-zinc-500" />
              <span>Áreas</span>
            </button>
          )}

          {/* Team / Invites (Admin only) */}
          {isAdmin && onOpenTeam && (
            <button
              type="button"
              onClick={onOpenTeam}
              className="p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Administrar Integrantes e Invitaciones"
            >
              <Users className="w-4 h-4 text-[#C92A2A]" />
              <span className="hidden sm:inline">Equipo</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
            title="Centro de Alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C92A2A] text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#E8E2D9]">
            <div className="w-8 h-8 rounded-full bg-[#FAF0F0] border border-[#F5D0D0] text-[#C92A2A] font-bold text-xs flex items-center justify-center">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#18181B] leading-tight truncate max-w-[140px]">
                {profile?.full_name || 'Usuario'}
              </div>
              <div className="mt-0.5">{getRoleBadge()}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="p-2.5 rounded-xl hover:bg-red-50 text-[#71717A] hover:text-[#C92A2A] transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  )
}
