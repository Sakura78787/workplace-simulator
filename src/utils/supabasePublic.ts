/**
 * 读取 Vite 注入的 Supabase 公网配置（构建期缺失变量时为 undefined，不会抛错）。
 */
export type SupabasePublicEnv = {
  baseUrl: string
  anonKey: string
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const urlRaw = import.meta.env.VITE_SUPABASE_URL
  const keyRaw = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (typeof urlRaw !== 'string' || typeof keyRaw !== 'string') return null
  const baseUrl = urlRaw.trim().replace(/\/+$/, '')
  const anonKey = keyRaw.trim()
  if (!baseUrl || !anonKey) return null
  return { baseUrl, anonKey }
}

/**
 * 拼接 Supabase 路径：base 无尾斜杠，path 须以 `/` 开头。
 */
export function joinSupabasePath(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
