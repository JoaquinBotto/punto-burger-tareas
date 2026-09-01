import React, { useState } from 'react'
import type { TaskWithDetails, Area } from '../../types'
import { calculateDashboardMetrics, calculateAreaProgress, getUrgentTasks } from '../../lib/metricsCalculations'
import { exportTasksToCsv } from '../../lib/exportUtils'
import { formatHeaderDate } from '../../lib/dateUtils'
import puntoBurgerLogo from '../../assets/brand/punto-burger-logo.png'
import {
  X,
  FileSpreadsheet,
  Printer,
  Filter
} from 'lucide-react'

interface ProgressReportModalProps {
  isOpen: boolean
  tasks: TaskWithDetails[]
  areas: Area[]
  onClose: () => void
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  tasks,
  areas,
  onClose
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all')

  if (!isOpen) return null

  const filteredTasks = selectedAreaId === 'all'
    ? tasks.filter(t => !t.archived_at && !t.is_demo)
    : tasks.filter(t => !t.archived_at && !t.is_demo && t.area_id === selectedAreaId)

  const metrics = calculateDashboardMetrics(filteredTasks)
  const areaProgress = calculateAreaProgress(tasks, areas)
  const urgentTasks = getUrgentTasks(filteredTasks)
  const todayFormatted = formatHeaderDate()

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = () => {
    exportTasksToCsv(filteredTasks, 'informe-avance-punto-burger')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden my-auto animate-in zoom-in-95 print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Header (Hidden on Print) */}
        <div className="p-4 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2] print:hidden">
          <div className="flex items-center gap-3">
            <img
              src={puntoBurgerLogo}
              alt="Punto Burger"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B]">Informe Ejecutivo de Avance</h2>
              <p className="text-xs text-[#71717A]">{todayFormatted} • Córdoba, ARG</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#18181B] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Imprimir o guardar PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-5 sm:p-8 flex-1 overflow-y-auto space-y-6 print:p-0 print:space-y-4">
          
          {/* Official Document Header (Visible on Print and Screen) */}
          <div className="flex items-center justify-between border-b pb-4 border-[#E8E2D9]">
            <div className="space-y-1">
              <img
                src={puntoBurgerLogo}
                alt="Punto Burger"
                className="h-10 sm:h-12 w-auto object-contain mb-1"
              />
              <h1 className="text-lg sm:text-xl font-black text-[#18181B] tracking-tight">
                Tablero de Control y Avance Operativo
              </h1>
              <p className="text-xs text-[#71717A]">
                Punto Burger — food drinks & coffee • Apertura y Operaciones
              </p>
            </div>
            <div className="text-right text-xs text-[#71717A] space-y-0.5">
              <p><strong className="text-[#18181B]">Fecha:</strong> {todayFormatted}</p>
              <p><strong className="text-[#18181B]">Zona Horaria:</strong> Córdoba, ARG</p>
              <p><strong className="text-[#18181B]">Tareas Activas:</strong> {filteredTasks.length}</p>
            </div>
          </div>

          {/* Area Filter (Hidden on Print) */}
          <div className="flex items-center justify-between gap-3 print:hidden bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D9]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#18181B]">
              <Filter className="w-4 h-4 text-[#C92A2A]" />
              <span>Filtrar Informe por Área:</span>
            </div>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
            >
              <option value="all">Todas las áreas ({tasks.filter(t => !t.archived_at && !t.is_demo).length} tareas)</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Executive Metrics Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B]">
              1. Resumen Ejecutivo
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Avance General</span>
                <span className="text-2xl font-black text-[#18181B]">{metrics.overallProgressPercentage}%</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">En Progreso</span>
                <span className="text-2xl font-black text-amber-900">{metrics.inProgressCount}</span>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold uppercase text-red-800 block">Bloqueadas</span>
                <span className="text-2xl font-black text-[#C92A2A]">{metrics.blockedCount}</span>
              </div>

              <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
                <span className="text-[10px] font-bold uppercase text-green-800 block">Completadas</span>
                <span className="text-2xl font-black text-green-800">{metrics.completedThisWeekCount}</span>
              </div>
            </div>
          </div>

          {/* Progress per Area Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B]">
              2. Avance Ponderado por Área
            </h3>

            <div className="space-y-2">
              {areaProgress.map(ap => (
                <div key={ap.areaId} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ap.color }} />
                      <span className="font-bold text-[#18181B]">{ap.name}</span>
                    </div>
                    <span className="font-bold text-[#18181B]">
                      {ap.completedTasks}/{ap.totalTasks} tareas ({ap.progressPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${ap.progressPercentage}%`, backgroundColor: ap.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent & Critical Tasks Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B]">
              3. Tareas Críticas y Atención Prioritaria ({urgentTasks.length})
            </h3>

            {urgentTasks.length === 0 ? (
              <p className="text-xs text-[#71717A]">No hay tareas urgentes o bloqueadas pendientes.</p>
            ) : (
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#71717A]">
                      <th className="p-3 font-bold">Tarea</th>
                      <th className="p-3 font-bold">Área</th>
                      <th className="p-3 font-bold">Prioridad</th>
                      <th className="p-3 font-bold">Estado</th>
                      <th className="p-3 font-bold">Motivo / Urgencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1]">
                    {urgentTasks.map(u => (
                      <tr key={u.task.id} className="hover:bg-zinc-50">
                        <td className="p-3 font-bold text-[#18181B]">{u.task.title}</td>
                        <td className="p-3 text-zinc-600">{u.task.area?.name || 'General'}</td>
                        <td className="p-3 uppercase font-bold text-[#C92A2A]">{u.task.priority}</td>
                        <td className="p-3 capitalize">{u.task.status.replace('_', ' ')}</td>
                        <td className="p-3 text-amber-900 font-semibold">{u.urgencyReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Report Footer */}
          <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>Generado automáticamente por Punto Burger | Tareas</span>
            <span>Documento Oficial de Seguimiento Operativo</span>
          </div>

        </div>

      </div>
    </div>
  )
}
