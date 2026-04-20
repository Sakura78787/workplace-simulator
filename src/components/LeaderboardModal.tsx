import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { CapsuleButton } from './common/CapsuleButton'
import { SPEC_LEADERBOARD_EMPTY } from '../config/specCopy'
import { SPRING_STIFF } from '../config/motion'
import { fetchLeaderboardTop20, type LeaderboardRow } from '../services/leaderboard'

type LeaderboardModalProps = {
  open: boolean
  onClose: () => void
}

function formatAnonLabel(suffix: string) {
  const safe = suffix.replace(/[^0-9a-fA-F]/g, '').slice(-4).toUpperCase()
  return `匿名打工人_${safe || '????'}`
}

/**
 * 极简只读榜：展示 RPC 返回的 Top20，无设备全量暴露。
 */
export function LeaderboardModal({ open, onClose }: LeaderboardModalProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLeaderboardTop20()
      setRows(data)
    } catch {
      setError('加载失败，请稍后再试。')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      void load()
    }
  }, [open, load])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING_STIFF}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-text-primary/35 backdrop-blur-[2px]"
            aria-label="关闭榜单"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-title"
            className="relative z-[81] max-h-[min(78dvh,640px)] w-full max-w-[380px] overflow-hidden rounded-3xl border border-white/50 bg-card-bg/95 shadow-[0_20px_48px_rgba(45,45,45,0.2)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={SPRING_STIFF}
          >
            <div className="flex items-center justify-between border-b border-text-secondary/10 px-5 py-4">
              <h2 id="leaderboard-title" className="font-heading text-lg text-text-primary">
                比惨排行榜
              </h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-xs text-text-secondary ring-1 ring-text-secondary/25 transition hover:bg-white/60"
                onClick={onClose}
              >
                关闭
              </button>
            </div>

            <div className="max-h-[min(60dvh,520px)] overflow-y-auto px-4 py-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-text-secondary">加载中…</p>
              ) : error ? (
                <p className="py-6 text-center text-sm text-critical">{error}</p>
              ) : rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">{SPEC_LEADERBOARD_EMPTY}</p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((row, index) => (
                    <motion.li
                      key={`${row.lb_rank}-${index}-${row.anon_suffix}`}
                      layout
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm shadow-sm"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={SPRING_STIFF}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-text-primary">
                          <span className="text-text-secondary">#{row.lb_rank}</span>{' '}
                          {formatAnonLabel(row.anon_suffix)}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {row.achieved_title} · {row.heat_percentage} · 扛到第 {row.rounds_survived} 回合
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] uppercase text-text-secondary">
                        {row.result_type === 'dead' ? '寄' : '过'}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-text-secondary/10 px-4 py-3">
              <CapsuleButton className="w-full" variant="warning" onClick={() => void load()}>
                刷新榜单
              </CapsuleButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
