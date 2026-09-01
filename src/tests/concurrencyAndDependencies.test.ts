import { describe, it, expect } from 'vitest'
import { taskService } from '../services/taskService'

describe('Concurrency Control & Versioning', () => {
  it('should validate version check parameter in updateTaskDetails', async () => {
    // When updating a non-existent task with a version requirement, it gracefully returns error
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const res = await taskService.updateTaskDetails(
      nonExistentId,
      { title: 'Test Update' },
      999
    )
    expect(res.success).toBe(false)
  })
})

describe('Dependency Types: Blocking vs Coordination', () => {
  it('should prevent self-dependency immediately', async () => {
    const id = '00000000-0000-0000-0000-000000000001'
    const resSelf = await taskService.addDependency(id, id, 'blocking')
    expect(resSelf.success).toBe(false)
    expect(resSelf.error).toContain('no puede depender de sí misma')
  })
})
