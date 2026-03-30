'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeItem } from '@/lib/types'

interface SaveResultModalProps {
  item: KnowledgeItem
  onClose: () => void
}

const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
  科学: { color: 'text-blue-600', bg: 'bg-blue-50', label: '🔬 科学系の探求' },
  歴史: { color: 'text-amber-600', bg: 'bg-amber-50', label: '🦉 歴史への好奇心' },
  技術: { color: 'text-purple-600', bg: 'bg-purple-50', label: '🤖 テクノロジーへの興味' },
  社会: { color: 'text-green-600', bg: 'bg-green-50', label: '🌍 社会への眼差し' },
  芸術: { color: 'text-pink-600', bg: 'bg-pink-50', label: '🎨 美と創造への感性' },
  その他: { color: 'text-[#2ba89e]', bg: 'bg-[#4ECDC4]/10', label: '✨ 自由な好奇心' },
}

export default function SaveResultModal({ item, onClose }: SaveResultModalProps) {
  const config = categoryConfig[item.category ?? 'その他'] ?? categoryConfig['その他']

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
          {/* カテゴリバッジ */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${config.bg} ${config.color}`}>
            {config.label}
          </div>

          {/* 質問 */}
          <p className="font-bold text-gray-800 text-lg leading-snug mb-3">
            {item.question}
          </p>

          {/* 要約 */}
          {item.summary && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {item.summary}
            </p>
          )}

          {/* タグ */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[#4ECDC4]/10 text-[#2ba89e] px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-2xl transition-colors"
          >
            閉じる
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
