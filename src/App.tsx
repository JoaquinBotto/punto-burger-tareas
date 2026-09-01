import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Header } from './components/common/Header'
import { OfflineBanner } from './components/common/OfflineBanner'
import { LoginModal } from './components/auth/LoginModal'
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal'
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal'
import { SetupAdminNotice } from './components/auth/SetupAdminNotice'
import { TaskList } from './components/tasks/TaskList'
import { QuickTaskModal } from './components/tasks/QuickTaskModal'
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer'
import { AreaManagerModal } from './components/areas/AreaManagerModal'
import { TeamManagerModal } from './components/team/TeamManagerModal'
import { taskService } from './services/taskService'
import { areaService } from './services/areaService'
import { profileService } from './services/profileService'
import type { TaskWithDetails, Area, Profile } from './types'
import { isSupabaseConfigured } from './lib/supabase'
import { Loader2, AlertTriangle, Flame, Database } from 'lucide-react'

const MainApp: React.FC = () => {
  const { session, user, profile, isAdmin, loading: authLoading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'forgot_password'>('login')
  const [showUpdatePassword, setShowUpdatePassword] = useState(false)

  // Data states
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modal / Drawer states
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [showAreaManager, setShowAreaManager] = useState(false)
  const [showTeamManager, setShowTeamManager] = useState(false)

  // Load project data
  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const [loadedAreas, loadedProfiles, loadedTasks] = await Promise.all([
        areaService.getAreas(isAdmin),
        profileService.getProfiles(true),
        taskService.getTasks()
      ])
      setAreas(loadedAreas)
      setProfiles(loadedProfiles)
      setTasks(loadedTasks)

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

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col text-[#18181B]">
      <OfflineBanner />
      <Header
        onOpenTeam={() => setShowTeamManager(true)}
        onOpenAlerts={() => alert('El Centro de Notificaciones y Alertas Internas se expande en la Etapa 3.')}
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
        
        {/* Connection Notice / Demo Banner if Supabase not yet connected */}
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

        {/* Task List Component */}
        {isLoadingData ? (
          <div className="p-12 text-center text-[#71717A] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
            <span className="text-sm font-semibold">Cargando tareas operativas...</span>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            areas={areas}
            profiles={profiles}
            isAdmin={isAdmin}
            onTaskClick={(task) => setSelectedTask(task)}
            onNewTaskClick={() => setShowQuickTaskModal(true)}
            onOpenAreaManager={() => setShowAreaManager(true)}
          />
        )}

      </main>

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
