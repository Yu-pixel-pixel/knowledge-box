'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult } from '@/lib/types'

interface AnalysisModalProps {
  analysis: AnalysisResult
  triggerCount: number
  onClose: () => void
}

export default function AnalysisModal({ analysis, triggerCount, onClose }: AnalysisModalProps) {
  const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm']

  const shareText = encodeURIComponent(
    `${analysis.tendency}\n\n${analysis.message}\n\n#Stockle #${triggerCount}個のギモン`
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-7"
        >
          {/* バッジ */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 bg-[#4ECDC4]/10 text-[#2ba89e] text-sm font-medium px-3 py-1.5 rounded-full mb-3">
              {triggerCount}個のギモンが集まった！
            </div>
            <h2 className="text-xl font-bold text-gray-800">{analysis.tendency}</h2>
          </div>

          {/* キーワードタグ雲 */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-5 py-2">
            {analysis.keywords.map((kw, i) => (
              <span
                key={kw}
                className={`font-bold text-[#4ECDC4] ${sizes[i] ?? 'text-sm'}`}
              >
                {kw}
              </span>
            ))}
          </div>

          {/* メッセージ */}
          <p className="text-center text-sm text-gray-600 leading-relaxed mb-6">
            {analysis.message}
          </p>

          {/* ボタン */}
          <div className="flex flex-col gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-3 bg-black text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Xでシェアする
            </a>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
