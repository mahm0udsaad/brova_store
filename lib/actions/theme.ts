"use server"

import { createClient } from '@/lib/supabase/server'
import { getAdminStoreContext } from '@/lib/supabase/queries/admin-store'
import { getThemeById } from '@/lib/themes'

export type UpdateStoreThemeResult =
  | { success: true; themeId: string }
  | { success: false; error: string }

export async function updateStoreTheme(themeId: string): Promise<UpdateStoreThemeResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const context = await getAdminStoreContext()
  if (!context) {
    return { success: false, error: 'No store found' }
  }

  const theme = getThemeById(themeId)
  if (!theme) {
    return { success: false, error: 'Theme not found' }
  }

  if (!theme.config.supportedStoreTypes.includes(context.store.type)) {
    return { success: false, error: 'Theme not supported for this store type' }
  }

  const { error } = await supabase
    .from('stores')
    .update({ theme_id: themeId })
    .eq('id', context.store.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, themeId }
}
