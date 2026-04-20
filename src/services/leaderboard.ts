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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!supabaseUrl || !supabaseAnonKey) return []

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_leaderboard_top20`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
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
