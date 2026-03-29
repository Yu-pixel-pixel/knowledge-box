'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { KnowledgeItem } from '@/lib/types'

interface KnowledgeCardProps {
  item: KnowledgeItem
  isNew?: boolean
  onDelete?: (id: string) => void
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

export default function KnowledgeCard({ item, isNew = false, onDelete }: KnowledgeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const colorClass = categoryColor[item.category ?? 'その他'] ?? categoryColor['その他']

  const handleDelete = async () => {
    if (!confirm('このカードを削除しますか？')) return
    setIsDeleting(true)
    try {
      await fetch(`/api/knowledge/${item.id}`, { method: 'DELETE' })
      onDelete?.(item.id)
    } catch {
      setIsDeleting(false)
    }
  }

  const handleShare = () => {
    const text = encodeURIComponent(
      `「${item.question}」\n\n${item.summary ?? ''}\n\n${(item.tags ?? []).map((t) => `#${t}`).join(' ')}\n\n#Stockle`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -16 } : false}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0, scale: isDeleting ? 0.95 : 1 }}
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

      {/* フッター */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
        <div className="flex items-center gap-2">
          {/* シェアボタン */}
          <button
            onClick={handleShare}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            シェア
          </button>
          {/* 削除ボタン */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>
    </motion.div>
  )
}
