import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BlobBackground } from './components/common/BlobBackground'
import { Meteors } from './components/common/Meteors'
import { ToastViewport } from './components/common/Toast'
import { LandingView } from './views/LandingView'
import { ResultView } from './views/ResultView'
import { SurvivalView } from './views/SurvivalView'
import { useLocation } from 'react-router-dom'
import { useGameStore } from './store/gameStore'

function App() {
  const location = useLocation()

  useEffect(() => {
    useGameStore.getState().ensureDeviceId()
  }, [])

  // Task 11: 强制监听 visibilitychange 和 pagehide 以进行本地存储同步
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        useGameStore.persist.rehydrate()
      }
    }

    const handlePageHide = () => {
      useGameStore.persist.rehydrate()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  /** Android 微信 X5：用 visualViewport 高度对齐可视区，减轻键盘/底栏遮挡。 */
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const syncViewportHeight = () => {
      document.documentElement.style.setProperty('--app-vvh', `${vv.height}px`)
    }

    vv.addEventListener('resize', syncViewportHeight)
    vv.addEventListener('scroll', syncViewportHeight)
    syncViewportHeight()

    return () => {
      vv.removeEventListener('resize', syncViewportHeight)
      vv.removeEventListener('scroll', syncViewportHeight)
      document.documentElement.style.removeProperty('--app-vvh')
    }
  }, [])

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-cream px-4 py-0">
      <BlobBackground />
      <Meteors />
      <ToastViewport />
      <main className="relative z-10 mx-auto box-border h-[var(--app-vvh,100dvh)] max-h-[var(--app-vvh,100dvh)] w-full max-w-[414px] overflow-x-hidden rounded-[32px] border border-white/45 bg-white/50 pb-[max(0px,env(safe-area-inset-bottom,0px))] text-text-primary shadow-[0_24px_56px_rgba(45,45,45,0.16)] backdrop-blur-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: 'blur(10px)', y: 15 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(5px)', y: -15 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<LandingView />} />
              <Route path="/survival" element={<SurvivalView />} />
              <Route path="/result" element={<ResultView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App

