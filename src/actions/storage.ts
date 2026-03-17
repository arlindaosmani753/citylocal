'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/guards'

export async function getSignedUploadUrl(
  fileName: string,
  postId: string
): Promise<{ signedUrl: string; path: string; token: string }> {
  const { userId } = await requireAuth()
  const supabase = await createClient()

  // Path format: posts/{postId}/{userId}-{timestamp}.{ext}
  const ext = fileName.split('.').pop() ?? 'jpg'
  const path = `posts/${postId}/${userId}-${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('post-images')
    .createSignedUploadUrl(path)

  if (error || !data) throw new Error('Failed to create upload URL')

  return { signedUrl: data.signedUrl, path, token: data.token }
}
