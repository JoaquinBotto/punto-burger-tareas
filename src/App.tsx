import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
import { Loader2, AlertTriangle, Plus } from 'lucide-react'
import puntoBurgerIcon from './assets/brand/punto-burger-icon.png'

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
  const [showProgressReport, setShowProgressReport] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showArchivedModal, setShowArchivedModal] = useState(false)
  const [showTagManagerModal, setShowTagManagerModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Load project data
  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const [loadedTasks, loadedAreas, loadedProfiles, loadedActivity, loadedNotifications, unread] = await Promise.all([
        taskService.getTasks(),
        areaService.getAreas(),
        profileService.getProfiles(),
        activityService.getRecentActivity(15),
        notificationService.getNotifications(30),
        notificationService.getUnreadCount()
      ])

      setTasks(loadedTasks)
      setAreas(loadedAreas)
      setProfiles(loadedProfiles)
      setActivity(loadedActivity)
      setNotifications(loadedNotifications)
      setUnreadCount(unread)

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

  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="flex items-center justify-center mb-4 animate-bounce">
          <img
            src={puntoBurgerIcon}
            alt="Punto Burger"
            className="w-16 h-16 object-contain drop-shadow-md"
          />
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

  // Account inactive / disabled notice
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] max-w-md shadow-xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#C92A2A] mx-auto" />
          <h2 className="text-xl font-bold text-[#18181B]">Cuenta Desactivada</h2>
          <p className="text-sm text-[#71717A]">
            Tu acceso a Punto Burger ha sido pausado. Contacta al administrador para habilitar tu usuario.
          </p>
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
            userName={profile?.full_name || 'Equipo'}
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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
