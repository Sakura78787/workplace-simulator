import type { AbShareVariant } from '../utils/abVariant'

const SHARE_SAVE_EVENT = 'share_save_click' as const

export type AbClickInsert = {
  deviceId: string
  variant: AbShareVariant
}

/**
 * 通过 Supabase REST 以 anon 身份写入 `ab_clicks`（表 RLS 仅允许 INSERT）。
 */
export async function insertAbClick({ deviceId, variant }: AbClickInsert): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!supabaseUrl || !supabaseAnonKey || !deviceId) return

  const response = await fetch(`${supabaseUrl}/rest/v1/ab_clicks`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
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
