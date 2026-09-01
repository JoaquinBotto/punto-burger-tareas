import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { formatHeaderDate } from '../../lib/dateUtils'
import {
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Bell,
  Users,
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Layers,
  FileSpreadsheet,
  Repeat,
  Archive,
  Tag as TagIcon,
  Settings,
  ChevronDown
} from 'lucide-react'
import puntoBurgerLogoCompact from '../../assets/brand/punto-burger-logo-compact.png'
import puntoBurgerIcon from '../../assets/brand/punto-burger-icon.png'

export type MainNavTab = 'dashboard' | 'my_day' | 'tasks'

interface HeaderProps {
  currentTab: MainNavTab
  onTabChange: (tab: MainNavTab) => void
  unreadAlertsCount?: number
  onOpenAlerts?: () => void
  onOpenTeam?: () => void
  onOpenAreas?: () => void
  onOpenReports?: () => void
  onOpenRecurring?: () => void
  onOpenArchived?: () => void
  onOpenTags?: () => void
  onOpenSettings?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  unreadAlertsCount = 0,
  onOpenAlerts,
  onOpenTeam,
  onOpenAreas,
  onOpenReports,
  onOpenRecurring,
  onOpenArchived,
  onOpenTags,
  onOpenSettings
}) => {
  const { profile, isAdmin, isResponsable, logout } = useAuth()
  const todayFormatted = formatHeaderDate()
  const [showAdminMenu, setShowAdminMenu] = useState(false)

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            {/* Desktop / Tablet Logo */}
            <img
              src={puntoBurgerLogoCompact}
              alt="Punto Burger"
              className="hidden sm:block h-8 md:h-9 w-auto object-contain"
            />
            {/* Mobile Icon */}
            <img
              src={puntoBurgerIcon}
              alt="Punto Burger"
              className="sm:hidden h-8 w-auto object-contain"
            />

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-[#FAF0F0] text-[#C92A2A] rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-[#F5D0D0]">
                Tareas
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                v1.1.1
              </span>
              <span className="hidden xl:inline text-[11px] text-[#71717A] font-medium pl-1">
                • {todayFormatted}
              </span>
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

        {/* Right: Actions & Admin Menus */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Informes de Avance (Reports) */}
          {onOpenReports && (
            <button
              type="button"
              onClick={onOpenReports}
              className="p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-bold"
              title="Ver Informe Ejecutivo y Exportar"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-700" />
              <span>Informe</span>
            </button>
          )}

          {/* Admin Management Dropdown */}
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EBE1] border border-[#E8E2D9] text-[#18181B] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title="Administración Global"
              >
                <span>Gestión</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showAdminMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAdminMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E8E2D9] shadow-xl p-2 z-50 space-y-1 text-xs animate-in zoom-in-95">
                    
                    {onOpenReports && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenReports()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer sm:hidden"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-700" />
                        <span>Informe y Exportación</span>
                      </button>
                    )}

                    {onOpenRecurring && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenRecurring()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <Repeat className="w-4 h-4 text-[#C92A2A]" />
                        <span>Rutinas Recurrentes</span>
                      </button>
                    )}

                    {onOpenAreas && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenAreas()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-zinc-700" />
                        <span>Administrar Áreas</span>
                      </button>
                    )}

                    {onOpenTeam && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenTeam()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-[#C92A2A]" />
                        <span>Equipo e Invitaciones</span>
                      </button>
                    )}

                    {onOpenTags && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenTags()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <TagIcon className="w-4 h-4 text-amber-600" />
                        <span>Administrar Etiquetas</span>
                      </button>
                    )}

                    {onOpenArchived && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenArchived()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <Archive className="w-4 h-4 text-zinc-600" />
                        <span>Tareas Archivadas</span>
                      </button>
                    )}

                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false)
                          onOpenSettings()
                        }}
                        className="w-full p-2 rounded-xl text-left font-semibold text-[#18181B] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer border-t border-[#F0EBE1] pt-2"
                      >
                        <Settings className="w-4 h-4 text-zinc-500" />
                        <span>Ajustes Generales</span>
                      </button>
                    )}

                  </div>
                </>
              )}
            </div>
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
