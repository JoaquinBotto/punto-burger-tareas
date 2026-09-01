import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Attachment } from '../types'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
])

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

/**
 * Sanitizes file names to remove special characters, spaces, and path separators
 */
export function sanitizeFileName(name: string): string {
  const extension = name.includes('.') ? '.' + name.split('.').pop()?.toLowerCase() : ''
  const baseName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name
  
  const cleanBase = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9_-]/g, '_') // only alphanumeric, underscore and dash
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 80)

  return `${cleanBase || 'archivo'}${extension}`
}

/**
 * Client-side compression for large images before upload
 */
export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  // If not an image or is GIF/SVG or already small (< 1.2 MB), return as is
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 1.2 * 1024 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          outputType,
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export const attachmentService = {
  validateFile(file: File): { isValid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido (${file.type || 'desconocido'}). Se admiten fotos (JPEG, PNG, WebP), PDFs y documentos de Office.`
      }
    }

    const isImage = file.type.startsWith('image/')
    const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_DOC_SIZE_BYTES

    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024)
      return {
        isValid: false,
        error: `El archivo excede el tamaño máximo permitido de ${maxMb} MB.`
      }
    }

    return { isValid: true }
  },

  async uploadTaskAttachment(
    taskId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; data?: Attachment; error?: string }> {
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    if (!isSupabaseConfigured) {
      const mockAttachment: Attachment = {
        id: 'att_' + Date.now(),
        task_id: taskId,
        file_name: file.name,
        storage_path: `tasks/${taskId}/mock_${file.name}`,
        file_size: file.size,
        file_type: file.type,
        profile_id: 'u1',
        created_at: new Date().toISOString()
      }
      return { success: true, data: mockAttachment }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id
      if (!currentUserId) {
        return { success: false, error: 'Sesión no válida. Vuelve a iniciar sesión.' }
      }

      onProgress?.(15)

      // 1. Optimize image if needed
      const fileToUpload = await compressImageIfNeeded(file)
      onProgress?.(35)

      // 2. Build secure storage path
      const attachmentId = crypto.randomUUID()
      const safeName = sanitizeFileName(fileToUpload.name)
      const storagePath = `tasks/${taskId}/${attachmentId}/${safeName}`

      // 3. Upload to private bucket task-attachments
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[attachmentService.uploadTaskAttachment] Storage error:', uploadError)
        return { success: false, error: uploadError.message || 'Error al subir archivo a Storage.' }
      }

      onProgress?.(75)

      // 4. Record row in public.attachments
      const { data: rowData, error: dbError } = await (supabase.from('attachments') as any)
        .insert({
          id: attachmentId,
          task_id: taskId,
          file_name: file.name,
          storage_path: storagePath,
          file_size: fileToUpload.size,
          file_type: fileToUpload.type,
          profile_id: currentUserId
        })
        .select()
        .single()

      if (dbError || !rowData) {
        // Rollback storage file on DB error
        await supabase.storage.from('task-attachments').remove([storagePath])
        console.error('[attachmentService.uploadTaskAttachment] DB error:', dbError)
        return { success: false, error: dbError?.message || 'Error al registrar archivo en la base de datos.' }
      }

      onProgress?.(100)
      return { success: true, data: rowData as Attachment }
    } catch (err: any) {
      console.error('[attachmentService.uploadTaskAttachment] Exception:', err)
      return { success: false, error: err.message || 'Error inesperado al subir archivo.' }
    }
  },

  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<{ url?: string; error?: string }> {
    if (!isSupabaseConfigured) {
      return { url: 'https://placehold.co/600x400?text=Mock+Attachment' }
    }

    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(storagePath, expiresIn)

      if (error || !data?.signedUrl) {
        return { error: error?.message || 'No se pudo generar el enlace seguro.' }
      }

      return { url: data.signedUrl }
    } catch (err: any) {
      return { error: err.message }
    }
  },

  async deleteAttachment(attachmentId: string, storagePath: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      // 1. Delete from DB
      const { error: dbErr } = await supabase.from('attachments').delete().eq('id', attachmentId)
      if (dbErr) {
        return { success: false, error: dbErr.message }
      }

      // 2. Remove from storage
      if (storagePath) {
        await supabase.storage.from('task-attachments').remove([storagePath])
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
