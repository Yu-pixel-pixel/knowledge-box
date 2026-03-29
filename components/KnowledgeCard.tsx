'use client'

import { motion } from 'framer-motion'
import type { KnowledgeItem } from '@/lib/types'

interface KnowledgeCardProps {
  item: KnowledgeItem
  isNew?: boolean
}

const categoryColor: Record<string, string> = {
  科学: 'bg-blue-50 text-blue-600',
  歴史: 'bg-amber-50 text-amber-600',
  技術: 'bg-purple-50 text-purple-600',
  社会: 'bg-green-50 text-green-600',
  芸術: 'bg-pink-50 text-pink-600',
  その他: 'bg-gray-50 text-gray-500',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function KnowledgeCard({ item, isNew = false }: KnowledgeCardProps) {
  const colorClass = categoryColor[item.category ?? 'その他'] ?? categoryColor['その他']

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-medium text-gray-800 leading-snug">{item.question}</p>
        {item.category && (
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
            {item.category}
          </span>
        )}
      </div>

      {/* 要約 */}
      {item.summary && (
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.summary}</p>
      )}

      {/* タグ */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.tags.map((tag) => (
            <span key={tag} className="text-xs bg-[#4ECDC4]/10 text-[#2ba89e] px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 日時 */}
      <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
    </motion.div>
  )
}
