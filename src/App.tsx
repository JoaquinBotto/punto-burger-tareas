import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Header, type MainNavTab } from './components/common/Header'
import { BottomNav, type NavTab } from './components/common/BottomNav'
import { OfflineBanner } from './components/common/OfflineBanner'
import { LoginModal } from './components/auth/LoginModal'
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal'
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal'
import { SetupAdminNotice } from './components/auth/SetupAdminNotice'
import { DashboardView } from './components/dashboard/DashboardView'
import { MyDayView } from './components/myday/MyDayView'
import { TaskList } from './components/tasks/TaskList'
import { QuickTaskModal } from './components/tasks/QuickTaskModal'
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer'
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer'
import { AreaManagerModal } from './components/areas/AreaManagerModal'
import { TeamManagerModal } from './components/team/TeamManagerModal'
import { taskService } from './services/taskService'
import { areaService } from './services/areaService'
import { profileService } from './services/profileService'
import { notificationService } from './services/notificationService'
import { activityService, type ActivityItem } from './services/activityService'
import type { TaskWithDetails, Area, Profile, Notification } from './types'
import { isSupabaseConfigured } from './lib/supabase'
import { Loader2, AlertTriangle, Flame, Database, Plus } from 'lucide-react'

const MainApp: React.FC = () => {
  const { session, user, profile, isAdmin, loading: authLoading } = useAuth()
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
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modal / Drawer states
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false)
  const [showAreaManager, setShowAreaManager] = useState(false)
  const [showTeamManager, setShowTeamManager] = useState(false)

  // Load project data
  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const [loadedAreas, loadedProfiles, loadedTasks, loadedActivity, loadedNotifications, unread] = await Promise.all([
        areaService.getAreas(isAdmin),
        profileService.getProfiles(true),
        taskService.getTasks(),
        activityService.getRecentActivity(20),
        notificationService.getNotifications(30),
        notificationService.getUnreadCount()
      ])
      setAreas(loadedAreas)
      setProfiles(loadedProfiles)
      setTasks(loadedTasks)
      setActivity(loadedActivity)
      setNotifications(loadedNotifications)
      setUnreadCount(unread)

      // Refresh selected task if open
      if (selectedTask) {
        const refreshed = loadedTasks.find(t => t.id === selectedTask.id)
        if (refreshed) setSelectedTask(refreshed)
      }
    } catch (err) {
      console.error('[App] Error loading data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  const refreshNotifications = async () => {
    const [loadedNotifications, unread] = await Promise.all([
      notificationService.getNotifications(30),
      notificationService.getUnreadCount()
    ])
    setNotifications(loadedNotifications)
    setUnreadCount(unread)
  }

  useEffect(() => {
    if (session || !isSupabaseConfigured) {
      loadData()
    }
  }, [session, isAdmin])

  // Detect recovery or invite links from URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=invite')) {
      setShowUpdatePassword(true)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C92A2A] text-white shadow-lg mb-4 animate-bounce">
          <Flame className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-[#18181B] font-bold text-base">
          <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
          <span>Cargando Punto Burger | Tareas...</span>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session || !user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <OfflineBanner />
        {authView === 'login' ? (
          <div>
            <LoginModal onForgotPassword={() => setAuthView('forgot_password')} />
            <div className="max-w-md mx-auto px-4 pb-12">
              <SetupAdminNotice />
            </div>
          </div>
        ) : (
          <ForgotPasswordModal onBack={() => setAuthView('login')} />
        )}
      </div>
    )
  }

  // Account deactivated check
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-red-200 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-[#C92A2A] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#18181B] mb-2">Acceso Desactivado</h2>
          <p className="text-sm text-[#71717A] mb-6">
            Tu cuenta ha sido deshabilitada por la administración de Punto Burger. Contacta a un administrador para restaurar tu acceso.
          </p>
        </div>
      </div>
    )
  }

  // Handle BottomNav clicks
  const handleBottomNavChange = (tab: NavTab) => {
    if (tab === 'alerts') {
      setShowNotificationsDrawer(true)
    } else if (tab === 'more') {
      if (isAdmin) {
        setShowTeamManager(true)
      } else {
        setShowNotificationsDrawer(true)
      }
    } else {
      setCurrentTab(tab as MainNavTab)
    }
  }

  const navigateToTasksWithFilter = (filter: {
    status?: string
    isBlockedOnly?: boolean
    areaId?: string
    priority?: string
  }) => {
    setActiveTaskFilters(filter)
    setCurrentTab('tasks')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col text-[#18181B]">
      <OfflineBanner />
      
      {/* Header */}
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
      />

      {showUpdatePassword && (
        <UpdatePasswordModal
          onSuccess={() => {
            setShowUpdatePassword(false)
            alert('¡Contraseña establecida con éxito!')
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Connection Notice if demo */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <strong className="font-bold">Modo Demostración Activo:</strong> Estás explorando las tareas operativas de Punto Burger en memoria.
              </div>
            </div>
            <span className="font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full text-[11px] self-start sm:self-auto">
              Configura .env para persistencia en Supabase
            </span>
          </div>
        )}

        {/* Dynamic View rendering */}
        {isLoadingData ? (
          <div className="p-12 text-center text-[#71717A] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
            <span className="text-sm font-semibold">Cargando tablero operativo...</span>
          </div>
        ) : currentTab === 'dashboard' ? (
          <DashboardView
            tasks={tasks}
            areas={areas}
            profiles={profiles}
            activity={activity}
            userName={profile?.full_name || 'Equipo'}
            onSelectTask={(t) => setSelectedTask(t)}
            onNavigateToTasksWithFilter={navigateToTasksWithFilter}
          />
        ) : currentTab === 'my_day' ? (
          <MyDayView
            tasks={tasks}
            onSelectTask={(t) => setSelectedTask(t)}
          />
        ) : (
          <TaskList
            tasks={tasks}
            areas={areas}
            profiles={profiles}
            isAdmin={isAdmin}
            initialAreaId={activeTaskFilters.areaId || 'all'}
            initialStatus={activeTaskFilters.status || 'all'}
            initialPriority={activeTaskFilters.priority || 'all'}
            initialIsBlockedOnly={Boolean(activeTaskFilters.isBlockedOnly)}
            onTaskClick={(task) => setSelectedTask(task)}
            onNewTaskClick={() => setShowQuickTaskModal(true)}
            onOpenAreaManager={() => setShowAreaManager(true)}
          />
        )}

      </main>

      {/* Floating Action Button for Mobile Quick Task */}
      <div className="md:hidden fixed bottom-20 right-4 z-30">
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
      <TaskDetailDrawer
        task={selectedTask}
        allTasks={tasks}
        areas={areas}
        profiles={profiles}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={loadData}
      />

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

    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
