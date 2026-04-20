import { motion } from 'framer-motion'
import type { GameResult } from '../store/gameStore'
import { X } from 'lucide-react'

type PokedexDrawerProps = {
  pokedex: GameResult[]
  onClose: () => void
}

export function PokedexDrawer({ pokedex, onClose }: PokedexDrawerProps) {
  // Reverse to show newest first
  const sortedPokedex = [...pokedex].reverse()

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="relative flex h-[85dvh] w-full max-w-[414px] flex-col rounded-t-[32px] bg-cream shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/40 p-6 pb-4">
          <div>
            <h2 className="font-heading text-2xl text-text-primary">打工履历</h2>
            <p className="text-sm text-text-secondary">你经历过的 {pokedex.length} 种职场人生</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-text-primary transition-colors hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-col gap-4">
            {sortedPokedex.map((record) => (
              <article
                key={record.resultId}
                className="overflow-hidden rounded-3xl border-2 border-white/50 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <header className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-heading text-xl text-text-primary">{record.achievedTitle}</h3>
                  <span
                    className={[
                      'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium tracking-wider',
                      record.resultType === 'dead'
                        ? 'bg-critical/10 text-critical'
                        : 'bg-mint/20 text-mint',
                    ].join(' ')}
                  >
                    {record.resultType === 'dead' ? '已离职' : '已通关'}
                  </span>
                </header>

                <div className="mb-4 rounded-2xl bg-cream/50 p-3 text-sm leading-relaxed text-text-secondary">
                  "{record.fatalQuote}"
                </div>

                {record.isHiddenEnding ? (
                  <div className="mb-4 rounded-2xl border border-critical/30 bg-critical/5 p-3 text-xs text-text-secondary">
                    <p className="font-medium text-critical">
                      隐藏结局：{record.hiddenEndingTag === 'active_resign_flow' ? '主动离职流' : '彻底摆烂流'}
                    </p>
                    {record.hiddenContext ? <p className="mt-1">{record.hiddenContext}</p> : null}
                  </div>
                ) : null}

                <footer className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex gap-3">
                    <span>大饼:{record.finalStats.kpi}</span>
                    <span>护盾:{record.finalStats.shield}</span>
                    <span>精神:{record.finalStats.mental}</span>
                  </div>
                  <span className="font-medium text-sunset">击败 {record.heatPercentage}</span>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
