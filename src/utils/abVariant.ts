export type AbShareVariant = 'self_mock' | 'pk_taunt'

/**
 * 本地 Sticky：按持久化 `deviceId`（UUID）末位十六进制奇偶分配实验组，不请求后端。
 */
export function resolveAbShareVariant(deviceId: string): AbShareVariant {
  const hex = deviceId.replace(/-/g, '')
  if (hex.length === 0) return 'self_mock'
  const last = hex[hex.length - 1]
  const n = Number.parseInt(last ?? '0', 16)
  if (Number.isNaN(n)) return 'self_mock'
  return n % 2 === 0 ? 'self_mock' : 'pk_taunt'
}
