import { getSupabasePublicEnv, joinSupabasePath } from '../utils/supabasePublic'

export type PokedexSyncPayload = {
  deviceId: string
  resultType: 'dead' | 'cleared'
  achievedTitle: string
  heatPercentage: string
  kpi: number
  shield: number
  mental: number
  roundsSurvived: number
}

/**
 * 结算后静默上报极简元数据（不含 fatal_quote / 图片）；anon 仅 INSERT。
 */
export async function insertPokedexSyncRow(payload: PokedexSyncPayload): Promise<void> {
  const supabase = getSupabasePublicEnv()
  if (!supabase || !payload.deviceId) return

  const response = await fetch(joinSupabasePath(supabase.baseUrl, '/rest/v1/pokedex_sync'), {
    method: 'POST',
    headers: {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${supabase.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      device_id: payload.deviceId,
      result_type: payload.resultType,
      achieved_title: payload.achievedTitle,
      heat_percentage: payload.heatPercentage,
      kpi: payload.kpi,
      shield: payload.shield,
      mental: payload.mental,
      rounds_survived: payload.roundsSurvived,
    }),
  })

  if (!response.ok) {
    console.warn('[pokedex_sync] insert failed', response.status, await response.text().catch(() => ''))
  }
}
