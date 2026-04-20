import { create } from 'zustand'

export type ToastTone = 'info' | 'warn' | 'error'

export type ToastPayload = {
  message: string
  tone?: ToastTone
  durationMs?: number
}

export type ToastMessage = Required<ToastPayload> & {
  id: number
}

type ToastStoreState = {
  activeToast: ToastMessage | null
  showToast: (payload: ToastPayload) => void
  clearToast: () => void
}

export const useToastStore = create<ToastStoreState>((set) => ({
  activeToast: null,
  showToast: ({ message, tone = 'info', durationMs = 3000 }) =>
    set({
      activeToast: {
        id: Date.now(),
        message,
        tone,
        durationMs,
      },
    }),
  clearToast: () => set({ activeToast: null }),
}))

export const useToastTrigger = () => useToastStore((state) => state.showToast)
