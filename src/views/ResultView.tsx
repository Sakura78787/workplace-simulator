import html2canvas from 'html2canvas'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'
import { CapsuleButton } from '../components/common/CapsuleButton'
import {
  SPEC_SHARE_SAVE_CTA_PK_TAUNT,
  SPEC_SHARE_SAVE_CTA_SELF_MOCK,
} from '../config/specCopy'
import { insertAbClick } from '../services/abClicks'
import { insertPokedexSyncRow } from '../services/pokedexSync'
import { useGameStore } from '../store/gameStore'
import { resolveAbShareVariant } from '../utils/abVariant'

type ResultSummary = {
  resultType: 'dead' | 'cleared'
  achievedTitle: string
  fatalQuote: string
  heatPercentage: string
  hiddenEndingTag?: 'active_resign_flow' | 'full_slack_flow'
  hiddenContext?: string
}

/** Task 17：裂变仅引流首页，不透传任何结局或 snapshot 参数。 */
const deployHomeUrl = `${window.location.origin}${window.location.pathname}#/`

/**
 * 按规格补充文档的称号基线映射结算头衔与致命金句。
 */
function buildResultSummary(
  status: 'dead' | 'cleared',
  stats: { kpi: number; shield: number; mental: number },
  fatalQuote: string,
  hiddenEndingMeta?: {
    hiddenEndingTag?: 'active_resign_flow' | 'full_slack_flow'
    hiddenContext?: string
  },
): ResultSummary {
  let achievedTitle = '普通打工人'

  if (status === 'dead') {
    if (stats.mental <= 0) achievedTitle = '精神已读不回'
    else if (stats.shield <= 0) achievedTitle = '孤狼·没有人站你'
    else achievedTitle = '大饼碎了一地'
  } else {
    if (stats.kpi > 60 && stats.shield > 60 && stats.mental > 60) achievedTitle = '职场端水大师'
    else if (stats.kpi <= 30 && stats.shield <= 30 && stats.mental <= 30) achievedTitle = '比死还惨的幸存者'
    else achievedTitle = '踩线通关的老油条'
  }

  const heatValue = Math.max(
    1,
    Math.min(
      99,
      Math.round((stats.mental * 0.5 + stats.kpi * 0.25 + stats.shield * 0.25) / 100 * 100),
    ),
  )

  return {
    resultType: status,
    achievedTitle,
    fatalQuote,
    heatPercentage: `${heatValue}%`,
    hiddenEndingTag: hiddenEndingMeta?.hiddenEndingTag,
    hiddenContext: hiddenEndingMeta?.hiddenContext,
  }
}

type ReceiptPosterProps = {
  summary: ResultSummary
  stats: {
    kpi: number
    shield: number
    mental: number
  }
  qrTarget: string
  compact?: boolean
}

function ReceiptPoster({ summary, stats, qrTarget, compact = false }: ReceiptPosterProps) {
  const radarData = [
    { subject: '大饼', value: stats.kpi },
    { subject: '护盾', value: stats.shield },
    { subject: '精神', value: stats.mental },
  ]

  return (
    <article
      className={[
        'rounded-3xl border border-white/60 bg-white/90 shadow-[0_20px_48px_rgba(45,45,45,0.14)] [-webkit-touch-callout:default]',
        compact ? 'p-6' : 'p-8',
      ].join(' ')}
    >
      <header className="space-y-2 border-b border-dashed border-text-secondary/20 pb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Workplace Receipt</p>
        <h1 className="font-heading text-3xl text-text-primary">{summary.achievedTitle}</h1>
        <p className="text-sm text-text-secondary">
          结局：{summary.resultType === 'dead' ? '工位寄了' : '险胜通关'} · 热力指数 {summary.heatPercentage}
        </p>
      </header>

      <div className="mt-5 rounded-2xl bg-cream/70 p-4">
        <p className="text-xs text-text-secondary">致命金句</p>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">{summary.fatalQuote}</p>
      </div>

      {summary.hiddenEndingTag ? (
        <div className="mt-3 rounded-2xl border border-critical/30 bg-critical/5 p-3">
          <p className="text-xs text-text-secondary">隐藏结局</p>
          <p className="mt-1 text-sm font-semibold text-critical">
            {summary.hiddenEndingTag === 'active_resign_flow' ? '主动离职流' : '彻底摆烂流'}
          </p>
          {summary.hiddenContext ? <p className="mt-1 text-xs text-text-secondary">{summary.hiddenContext}</p> : null}
        </div>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-4">
        <div className="h-[200px] w-[200px] rounded-2xl bg-white/70 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(47,42,38,0.18)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b6159', fontSize: 12 }} />
              <Radar dataKey="value" stroke="#FFAAA5" fill="#A8E6CF" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 rounded-2xl bg-white/80 p-3 text-center">
          <QRCodeSVG value={qrTarget} size={80} includeMargin />
          <p className="text-[10px] text-text-secondary">扫码再来一局</p>
        </div>
      </div>
    </article>
  )
}

export function ResultView() {
  const navigate = useNavigate()
  const status = useGameStore((state) => state.status)
  const stats = useGameStore((state) => state.stats)
  const eventLog = useGameStore((state) => state.eventLog)
  const currentRole = useGameStore((state) => state.currentRole)
  const deviceId = useGameStore((state) => state.deviceId)
  const pendingHiddenEnding = useGameStore((state) => state.pendingHiddenEnding)
  const ensureDeviceId = useGameStore((state) => state.ensureDeviceId)
  const addGameResult = useGameStore((state) => state.addGameResult)
  const currentRound = useGameStore((state) => state.currentRound)
  const [isExporting, setIsExporting] = useState(false)
  const exportPosterRef = useRef<HTMLDivElement | null>(null)
  const hasSavedRef = useRef(false)
  const lastAbClickAtRef = useRef(0)

  useEffect(() => {
    ensureDeviceId()
  }, [ensureDeviceId])

  useEffect(() => {
    if (!status || (status !== 'dead' && status !== 'cleared')) {
      navigate('/', { replace: true })
    }
  }, [status, navigate])

  const shareSaveCtaLabel = useMemo(() => {
    const variant = resolveAbShareVariant(deviceId)
    return variant === 'self_mock' ? SPEC_SHARE_SAVE_CTA_SELF_MOCK : SPEC_SHARE_SAVE_CTA_PK_TAUNT
  }, [deviceId])

  const fatalQuote = useMemo(() => {
    const latestNpc = [...eventLog].reverse().find((item) => item.role === 'npc')?.content
    const latestSystem = [...eventLog].reverse().find((item) => item.role === 'system')?.content
    return latestNpc ?? latestSystem ?? '今天这口锅，你先背着。'
  }, [eventLog])

  const normalizedStatus = status === 'dead' ? 'dead' : 'cleared'
  const safeStats = { kpi: stats?.kpi ?? 0, shield: stats?.shield ?? 0, mental: stats?.mental ?? 0 }
  const summary = useMemo(
    () => buildResultSummary(normalizedStatus, safeStats, fatalQuote, pendingHiddenEnding ?? undefined),
    [normalizedStatus, safeStats, fatalQuote, pendingHiddenEnding],
  )

  useEffect(() => {
    if (!hasSavedRef.current) {
      hasSavedRef.current = true

      addGameResult({
        resultType: summary.resultType,
        finalStats: { ...safeStats },
        achievedTitle: summary.achievedTitle,
        fatalQuote: summary.fatalQuote,
        heatPercentage: summary.heatPercentage,
        isHiddenEnding: Boolean(summary.hiddenEndingTag),
        hiddenEndingTag: summary.hiddenEndingTag,
        hiddenContext: summary.hiddenContext,
      })

      const id = useGameStore.getState().deviceId
      if (id) {
        void insertPokedexSyncRow({
          deviceId: id,
          resultType: summary.resultType,
          achievedTitle: summary.achievedTitle,
          heatPercentage: summary.heatPercentage,
          kpi: safeStats.kpi,
          shield: safeStats.shield,
          mental: safeStats.mental,
          roundsSurvived: currentRound ?? 1,
        })
      }
    }
  }, [summary, safeStats, addGameResult, currentRound])

  /**
   * 记录分享/保存按钮点击（~1s 防抖；每次有效点击各写一行 INSERT）。
   */
  const tryLogShareSaveClick = () => {
    const now = Date.now()
    if (now - lastAbClickAtRef.current < 1000) return
    lastAbClickAtRef.current = now
    const id = useGameStore.getState().deviceId
    if (!id) return
    const variant = resolveAbShareVariant(id)
    void insertAbClick({ deviceId: id, variant })
  }

  /**
   * 以 720x1280 离屏节点渲染海报并触发下载。
   */
  const handleSaveResult = async () => {
    if (!exportPosterRef.current) return

    tryLogShareSaveClick()

    setIsExporting(true)
    try {
      const canvas = await html2canvas(exportPosterRef.current, {
        backgroundColor: '#ffffff',
        width: 720,
        height: 1280,
        scale: 2,
        useCORS: true,
        /** Android 微信 X5：foreignObject 易白屏，优先位图合成路径。 */
        foreignObjectRendering: false,
      })
      const imageUrl = canvas.toDataURL('image/png', 1)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `结局海报-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section
      className="relative flex h-full flex-col overflow-y-auto px-5 pt-6"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        className="absolute top-4 left-4 z-50 flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs text-text-secondary shadow-sm backdrop-blur-sm"
        onClick={() => {
          if (window.confirm('确定要退出并返回首页吗？')) {
            useGameStore.getState().resetForTest()
            navigate('/')
          }
        }}
      >
        <ChevronLeft size={14} />
        返回
      </button>
      <div className="mx-auto w-full max-w-[360px]">
        <ReceiptPoster summary={summary} stats={safeStats} qrTarget={deployHomeUrl} compact />
      </div>

      <div className="mt-6 grid gap-3">
        <CapsuleButton onClick={handleSaveResult} disabled={isExporting}>
          {isExporting ? '正在生成海报...' : shareSaveCtaLabel}
        </CapsuleButton>
        <CapsuleButton variant="warning" onClick={() => navigate('/')}>
          重新入职（{currentRole ?? '待选岗'}）
        </CapsuleButton>
      </div>

      <div className="pointer-events-none absolute -left-[9999px] top-0">
        <div
          ref={exportPosterRef}
          style={{
            width: '720px',
            height: '1280px',
            background: '#fff6d9',
            padding: '56px',
            boxSizing: 'border-box',
          }}
        >
          <ReceiptPoster summary={summary} stats={safeStats} qrTarget={deployHomeUrl} />
        </div>
      </div>
    </section>
  )
}
