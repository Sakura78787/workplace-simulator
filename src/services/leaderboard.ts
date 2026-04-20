import { getSupabasePublicEnv, joinSupabasePath } from '../utils/supabasePublic'

export type LeaderboardRow = {
  lb_rank: number
  anon_suffix: string
  result_type: 'dead' | 'cleared'
  achieved_title: string
  heat_percentage: string
  rounds_survived: number
  kpi: number
  shield: number
  mental: number
}

/**
 * 调用 `get_leaderboard_top20` RPC（anon 无表 SELECT，仅 EXECUTE）。
 */
export async function fetchLeaderboardTop20(): Promise<LeaderboardRow[]> {
  const supabase = getSupabasePublicEnv()
  if (!supabase) return []

  const response = await fetch(joinSupabasePath(supabase.baseUrl, '/rest/v1/rpc/get_leaderboard_top20'), {
    method: 'POST',
    headers: {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${supabase.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!response.ok) {
    console.warn('[leaderboard] rpc failed', response.status, await response.text().catch(() => ''))
    return []
  }

  const data = (await response.json()) as unknown
  if (!Array.isArray(data)) return []

  return data as LeaderboardRow[]
}
