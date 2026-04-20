import type { AbShareVariant } from '../utils/abVariant'
import { getSupabasePublicEnv, joinSupabasePath } from '../utils/supabasePublic'

const SHARE_SAVE_EVENT = 'share_save_click' as const

export type AbClickInsert = {
  deviceId: string
  variant: AbShareVariant
}

/**
 * 通过 Supabase REST 以 anon 身份写入 `ab_clicks`（表 RLS 仅允许 INSERT）。
 */
export async function insertAbClick({ deviceId, variant }: AbClickInsert): Promise<void> {
  const supabase = getSupabasePublicEnv()
  if (!supabase || !deviceId) return

  const response = await fetch(joinSupabasePath(supabase.baseUrl, '/rest/v1/ab_clicks'), {
    method: 'POST',
    headers: {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${supabase.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      device_id: deviceId,
      variant,
      event: SHARE_SAVE_EVENT,
    }),
  })

  if (!response.ok) {
    console.warn('[ab_clicks] insert failed', response.status, await response.text().catch(() => ''))
  }
}
