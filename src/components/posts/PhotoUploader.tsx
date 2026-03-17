'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { getSignedUploadUrl } from '@/actions/storage'

type Props = {
  postId: string
  onUploadComplete: (paths: string[]) => void
}

export function PhotoUploader({ postId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const paths: string[] = []

    try {
      for (const file of acceptedFiles) {
        const { signedUrl, path, token } = await getSignedUploadUrl(file.name, postId)
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .uploadToSignedUrl(path, token, file, { contentType: file.type })
        if (uploadError) throw uploadError
        paths.push(path)
      }
      onUploadComplete(paths)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [postId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,  // 10MB — matches bucket file_size_limit
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'
        }`}
      >
        <input {...getInputProps()} />
        {uploading
          ? <p>Uploading...</p>
          : <p>Drop photos here or click to select (up to 5)</p>
        }
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
