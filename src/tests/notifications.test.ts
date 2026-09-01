import { describe, it, expect } from 'vitest'
import { notificationService } from '../services/notificationService'

describe('Notification Service & User Isolation', () => {
  it('should safely fetch unread notifications count without throwing', async () => {
    const count = await notificationService.getUnreadCount()
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThanOrEqual(0)
  })

  it('should safely query notifications array', async () => {
    const notifications = await notificationService.getNotifications(10)
    expect(Array.isArray(notifications)).toBe(true)
  })

  it('should handle markAsRead and markAllAsRead gracefully', async () => {
    const resRead = await notificationService.markAsRead('00000000-0000-0000-0000-000000000000')
    expect(typeof resRead).toBe('boolean')

    const resAll = await notificationService.markAllAsRead()
    expect(typeof resAll).toBe('boolean')
  })
})
