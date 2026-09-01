import React, { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-[#18181B] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 text-[#C92A2A] animate-pulse" />
      <span>
        Sin conexión a internet. La aplicación está en modo solo lectura para evitar desfasajes.
      </span>
    </div>
  )
}
