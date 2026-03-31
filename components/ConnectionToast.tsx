'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConnectionToastProps {
  relatedQuestion: string
  reason: string
  onClose: () => void
}

export default function ConnectionToast({ relatedQuestion, reason, onClose }: ConnectionToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
        onClick={onClose}
      >
        <div className="bg-[#0f0f23] border border-[#4ECDC4]/30 rounded-2xl px-4 py-3.5 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">🔗</span>
            <div className="min-w-0">
              <p className="text-[#4ECDC4] text-xs font-bold mb-1 tracking-wide">つながりを発見！</p>
              <p className="text-white/80 text-sm leading-snug mb-1.5">
                「<span className="text-white font-medium">{relatedQuestion}</span>」
              </p>
              <p className="text-white/40 text-xs">{reason}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
