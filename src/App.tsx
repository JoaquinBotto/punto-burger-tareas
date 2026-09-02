import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Header, type MainNavTab } from './components/common/Header'
import { BottomNav, type NavTab } from './components/common/BottomNav'
import { OfflineBanner } from './components/common/OfflineBanner'
import { LoginModal } from './components/auth/LoginModal'
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal'
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal'
import { DashboardView } from './components/dashboard/DashboardView'
import { MyDayView } from './components/myday/MyDayView'
import { TaskList } from './components/tasks/TaskList'
import { QuickTaskModal } from './components/tasks/QuickTaskModal'
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer'
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer'
import { AreaManagerModal } from './components/areas/AreaManagerModal'
import { TeamManagerModal } from './components/team/TeamManagerModal'
import { ProgressReportModal } from './components/reports/ProgressReportModal'
import { RecurringManagerModal } from './components/recurring/RecurringManagerModal'
import { ArchivedTasksModal } from './components/tasks/ArchivedTasksModal'
import { TagManagerModal } from './components/tags/TagManagerModal'
import { AppSettingsModal } from './components/settings/AppSettingsModal'
import { taskService } from './services/taskService'
import { areaService } from './services/areaService'
import { profileService } from './services/profileService'
import { notificationService } from './services/notificationService'
import { activityService, type ActivityItem } from './services/activityService'
import type { TaskWithDetails, Area, Profile, Notification } from './types'
import { isSupabaseConfigured } from './lib/supabase'
import { Loader2, AlertTriangle, RotateCcw, LogOut, Plus } from 'lucide-react'
import puntoBurgerIcon from './assets/brand/punto-burger-icon.png'

const DATA_TIMEOUT_MS = 12000

const MainApp: React.FC = () => {
  const { session, user, profile, isAdmin, loading: authLoading, logout } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'forgot_password'>('login')
  const [showUpdatePassword, setShowUpdatePassword] = useState(false)

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard')

  // Task Filter from Dashboard navigation
  const [activeTaskFilters, setActiveTaskFilters] = useState<{
    areaId?: string
    status?: string
    priority?: string
    isBlockedOnly?: boolean
  }>({})

  // Data states
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  
  // Independent loading & error states
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)

  // Modal / Drawer states
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false)
  const [showAreaManager, setShowAreaManager] = useState(false)
  const [showTeamManager, setShowTeamManager] = useState(false)
  const [showProgressReport, setShowProgressReport] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showArchivedModal, setShowArchivedModal] = useState(false)
  const [showTagManagerModal, setShowTagManagerModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resilient data loading
  const loadData = useCallback(async () => {
    setIsLoadingData(true)
    setDataLoadError(null)

    // Set a controlled watchdog timeout
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoadingData(false)
      setDataLoadError('El servidor tardó demasiado en responder. Comprobá tu conexión a Internet o reintentá.')
    }, DATA_TIMEOUT_MS)

    try {
      // 1. Critical data: tasks, areas, profiles
      const [loadedTasks, loadedAreas, loadedProfiles] = await Promise.all([
        taskService.getTasks(),
        areaService.getAreas(),
        profileService.getProfiles()
      ])

      setTasks(loadedTasks)
      setAreas(loadedAreas)
      setProfiles(loadedProfiles)

      if (selectedTask) {
        const refreshed = loadedTasks.find(t => t.id === selectedTask.id)
        if (refreshed) setSelectedTask(refreshed)
      }

      // 2. Non-critical secondary data: activity & notifications (failures won't block the app)
      Promise.allSettled([
        activityService.getRecentActivity(15),
        notificationService.getNotifications(30),
        notificationService.getUnreadCount()
      ]).then(([activityRes, notifRes, unreadRes]) => {
        if (activityRes.status === 'fulfilled') {
          setActivity(activityRes.value)
        }
        if (notifRes.status === 'fulfilled') {
          setNotifications(notifRes.value)
        }
        if (unreadRes.status === 'fulfilled') {
          setUnreadCount(unreadRes.value)
        }
      })

    } catch (err: any) {
      console.error('[App] Error loading data:', err)
      setDataLoadError(err?.message || 'No pudimos cargar la información. Revisá tu conexión o intentá nuevamente.')
    } finally {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      setIsLoadingData(false)
    }
  }, [selectedTask])

  const refreshNotifications = async () => {
    try {
      const [loadedNotifications, unread] = await Promise.all([
        notificationService.getNotifications(30),
        notificationService.getUnreadCount()
      ])
      setNotifications(loadedNotifications)
      setUnreadCount(unread)
    } catch (err) {
      console.warn('[App] Error refreshing notifications:', err)
    }
  }

  // Trigger data load when session exists
  useEffect(() => {
    if (session || !isSupabaseConfigured) {
      loadData()
    }
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    }
  }, [session, isAdmin])

  // Detect recovery or invite links from URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=invite')) {
      setShowUpdatePassword(true)
    }
  }, [])

  // 1. Auth check loading state ONLY
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 selection:bg-[#C92A2A] selection:text-white">
        <div className="flex items-center justify-center mb-4 animate-bounce">
          <img
            src={puntoBurgerIcon}
            alt="Punto Burger"
            className="w-16 h-16 object-contain drop-shadow-md"
          />
        </div>
        <div className="flex items-center gap-2 text-[#18181B] font-bold text-base">
          <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
          <span>Verificando sesión...</span>
        </div>
      </div>
    )
  }

  // 2. Not authenticated: render Login immediately without blocking!
  if (!session || !user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        {showUpdatePassword && (
          <UpdatePasswordModal
            onSuccess={() => {
              setShowUpdatePassword(false)
              window.location.hash = ''
            }}
          />
        )}

        {authView === 'login' ? (
          <LoginModal onForgotPassword={() => setAuthView('forgot_password')} />
        ) : (
          <ForgotPasswordModal onBack={() => setAuthView('login')} />
        )}
      </div>
    )
  }

  // 3. Account inactive / disabled notice
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] max-w-md shadow-xl space-y-4 animate-in fade-in">
          <AlertTriangle className="w-12 h-12 text-[#C92A2A] mx-auto" />
          <h2 className="text-xl font-bold text-[#18181B]">Cuenta Desactivada</h2>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Tu acceso a Punto Burger ha sido pausado por el administrador.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    )
  }

  // 4. Critical Data Loading Error (Recoverable view)
  if (dataLoadError && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] max-w-md w-full shadow-xl space-y-5 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-[#18181B]">No se pudo cargar la información</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">{dataLoadError}</p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => loadData()}
              className="w-full py-3 bg-[#C92A2A] hover:bg-[#B02525] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 text-xs font-semibold text-[#71717A] hover:text-[#C92A2A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 5. Initial Data Loading Spinner for authenticated users
  if (isLoadingData && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 selection:bg-[#C92A2A] selection:text-white">
        <div className="flex items-center justify-center mb-4 animate-bounce">
          <img
            src={puntoBurgerIcon}
            alt="Punto Burger"
            className="w-16 h-16 object-contain drop-shadow-md"
          />
        </div>
        <div className="flex items-center gap-2 text-[#18181B] font-bold text-base">
          <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
          <span>Cargando tablero operativo...</span>
        </div>
      </div>
    )
  }

  // Filter handler from Dashboard cards
  const handleNavigateWithFilters = (filters: { areaId?: string; status?: string; priority?: string; isBlockedOnly?: boolean }) => {
    setActiveTaskFilters(filters)
    setCurrentTab('tasks')
  }

  // Bottom Nav Change Handler
  const handleBottomNavChange = (tab: NavTab) => {
    if (tab === 'alerts') {
      setShowNotificationsDrawer(true)
    } else {
      setCurrentTab(tab as MainNavTab)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#18181B] pb-24 md:pb-8 flex flex-col selection:bg-[#C92A2A] selection:text-white">
      {/* Offline Status Alert */}
      <OfflineBanner />

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setActiveTaskFilters({})
          setCurrentTab(tab)
        }}
        unreadAlertsCount={unreadCount}
        onOpenAlerts={() => setShowNotificationsDrawer(true)}
        onOpenTeam={() => setShowTeamManager(true)}
        onOpenAreas={() => setShowAreaManager(true)}
        onOpenReports={() => setShowProgressReport(true)}
        onOpenRecurring={() => setShowRecurringModal(true)}
        onOpenArchived={() => setShowArchivedModal(true)}
        onOpenTags={() => setShowTagManagerModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* TAB 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            areas={areas}
            profiles={profiles}
            activity={activity}
            userName={profile?.full_name || (user?.user_metadata as any)?.full_name || (user?.email ? user.email.split('@')[0] : 'Usuario')}
            onSelectTask={(task) => setSelectedTask(task)}
            onNavigateToTasksWithFilter={handleNavigateWithFilters}
          />
        )}

        {/* TAB 2: MY DAY */}
        {currentTab === 'my_day' && (
          <MyDayView
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}

        {/* TAB 3: TASKS LIST */}
        {currentTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            areas={areas}
            profiles={profiles}
            initialAreaId={activeTaskFilters.areaId}
            initialStatus={activeTaskFilters.status}
            initialPriority={activeTaskFilters.priority}
            initialIsBlockedOnly={activeTaskFilters.isBlockedOnly}
            onTaskClick={(task: TaskWithDetails) => setSelectedTask(task)}
            onNewTaskClick={() => setShowQuickTaskModal(true)}
            isAdmin={isAdmin}
          />
        )}

      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setShowQuickTaskModal(true)}
          className="w-13 h-13 rounded-full bg-[#C92A2A] text-white shadow-xl shadow-[#C92A2A]/40 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          title="Crear tarea rápida"
          aria-label="Crear tarea rápida"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Mobile Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleBottomNavChange}
        unreadCount={unreadCount}
      />

      {/* Quick Task Modal */}
      <QuickTaskModal
        isOpen={showQuickTaskModal}
        areas={areas}
        profiles={profiles}
        onClose={() => setShowQuickTaskModal(false)}
        onTaskCreated={(newTask) => {
          setTasks([newTask, ...tasks])
          setSelectedTask(newTask)
        }}
      />

      {/* Task Detail Drawer */}
      <ErrorBoundary fallbackTitle="Error al abrir el detalle de la tarea">
        <TaskDetailDrawer
          task={selectedTask}
          allTasks={tasks}
          areas={areas}
          profiles={profiles}
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={loadData}
        />
      </ErrorBoundary>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={showNotificationsDrawer}
        notifications={notifications}
        tasks={tasks}
        onClose={() => setShowNotificationsDrawer(false)}
        onRefreshNotifications={refreshNotifications}
        onSelectTask={(t) => setSelectedTask(t)}
      />

      {/* Area Manager Modal */}
      <AreaManagerModal
        isOpen={showAreaManager}
        areas={areas}
        onClose={() => setShowAreaManager(false)}
        onAreasUpdated={loadData}
      />

      {/* Team Manager Modal */}
      <TeamManagerModal
        isOpen={showTeamManager}
        onClose={() => setShowTeamManager(false)}
        onTeamUpdated={loadData}
      />

      {/* Progress Report Modal (Fase D) */}
      <ProgressReportModal
        isOpen={showProgressReport}
        tasks={tasks}
        areas={areas}
        onClose={() => setShowProgressReport(false)}
      />

      {/* Recurring Task Manager Modal (Fase C) */}
      <RecurringManagerModal
        isOpen={showRecurringModal}
        areas={areas}
        profiles={profiles}
        onClose={() => setShowRecurringModal(false)}
        onRulesUpdated={loadData}
      />

      {/* Archived Tasks Modal (Fase E) */}
      <ArchivedTasksModal
        isOpen={showArchivedModal}
        tasks={tasks}
        onClose={() => setShowArchivedModal(false)}
        onTaskRestored={loadData}
      />

      {/* Tag Manager Modal (Fase E) */}
      <TagManagerModal
        isOpen={showTagManagerModal}
        onClose={() => setShowTagManagerModal(false)}
        onTagsUpdated={loadData}
      />

      {/* App Settings Modal (Fase E) */}
      <AppSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Error en Punto Burger | Tareas">
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  )
}
