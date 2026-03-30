'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpgradeModalProps {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 border border-gray-100"
        >
          {/* アイコン */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">🌌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              今月の上限に達しました
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              無料プランは月30件まで。<br />
              プレミアムにアップグレードすると<br />
              <span className="font-medium text-gray-700">無制限</span>でギモンを記録できます。
            </p>
          </div>

          {/* プラン比較 */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden mb-5">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <span className="text-sm text-gray-500">無料プラン</span>
              <span className="text-sm font-medium text-gray-700">月30件まで</span>
            </div>
            <div className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#4ECDC4]/5 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#2ba89e]">✨ プレミアム</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-800">¥300</span>
                <span className="text-xs text-gray-400">/月</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-3.5 bg-[#4ECDC4] hover:bg-[#3bbdb4] disabled:opacity-60 text-white font-bold rounded-2xl transition-colors mb-3"
          >
            {isLoading ? '処理中...' : 'プレミアムにアップグレード'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            今はしない
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
