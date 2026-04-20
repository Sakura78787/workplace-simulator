import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { SPRING_STIFF } from '../../config/motion'

type StatusBarProps = {
  stats: {
    kpi: number
    shield: number
    mental: number
  }
}

type MetricItemProps = {
  label: string
  value: number
  foregroundClassName: string
  trackClassName: string
  flashKey: number
}

/** 单条指标：进度条 + 暴跌红框（规格补充文档：单次跌幅 >20，120ms×3）。 */
function MetricItem({ label, value, foregroundClassName, trackClassName, flashKey }: MetricItemProps) {
  return (
    <div className="relative space-y-1">
      {flashKey > 0 ? (
        <motion.div
          key={flashKey}
          className="pointer-events-none absolute -inset-x-0.5 -inset-y-0.5 rounded-2xl border-2 border-critical"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
          transition={{ duration: 0.36, ease: 'easeOut' }}
        />
      ) : null}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className={['h-2.5 w-full overflow-hidden rounded-full', trackClassName].join(' ')}>
        <motion.div
          className={['h-full rounded-full', foregroundClassName].join(' ')}
          animate={{ width: `${value}%` }}
          transition={SPRING_STIFF}
        />
      </div>
    </div>
  )
}

export function StatusBar({ stats }: StatusBarProps) {
  const previousStatsRef = useRef(stats)
  const [kpiFlash, setKpiFlash] = useState(0)
  const [shieldFlash, setShieldFlash] = useState(0)
  const [mentalFlash, setMentalFlash] = useState(0)

  useEffect(() => {
    const prev = previousStatsRef.current
    const kpiDrop = prev.kpi - stats.kpi
    const shieldDrop = prev.shield - stats.shield
    const mentalDrop = prev.mental - stats.mental

    if (kpiDrop > 20) setKpiFlash((n) => n + 1)
    if (shieldDrop > 20) setShieldFlash((n) => n + 1)
    if (mentalDrop > 20) setMentalFlash((n) => n + 1)

    previousStatsRef.current = stats
  }, [stats])

  return (
    <div className="sticky top-0 z-20 px-4 pb-3 pt-4">
      <div className="relative rounded-2xl border border-white/45 bg-white/50 p-3 shadow-sm ring-1 ring-text-secondary/15 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-3">
          <MetricItem
            label="老板画的大饼"
            value={stats.kpi}
            foregroundClassName="bg-mint"
            trackClassName="bg-mint/30"
            flashKey={kpiFlash}
          />
          <MetricItem
            label="免喷护盾"
            value={stats.shield}
            foregroundClassName="bg-babyblue"
            trackClassName="bg-babyblue/30"
            flashKey={shieldFlash}
          />
          <MetricItem
            label="精神状态"
            value={stats.mental}
            foregroundClassName="bg-sunset"
            trackClassName="bg-sunset/30"
            flashKey={mentalFlash}
          />
        </div>
      </div>
    </div>
  )
}
