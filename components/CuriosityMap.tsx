'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { KnowledgeItem } from '@/lib/types'

interface CuriosityMapProps {
  items: KnowledgeItem[]
}

const categoryConfig = {
  技術: { color: '#A78BFA', bg: '#EDE9FE', char: '🤖', label: 'テクノロジー探求者' },
  科学: { color: '#60A5FA', bg: '#DBEAFE', char: '🔬', label: 'サイエンス冒険家' },
  歴史: { color: '#FBBF24', bg: '#FEF3C7', char: '🦉', label: 'タイムトラベラー' },
  社会: { color: '#34D399', bg: '#D1FAE5', char: '🌍', label: 'ソーシャルアナリスト' },
  芸術: { color: '#F472B6', bg: '#FCE7F3', char: '🎨', label: 'クリエイティブマインド' },
  その他: { color: '#4ECDC4', bg: '#CCFBF1', char: '✨', label: 'ワンダラー' },
}

// バブルの固定位置（キャラの周り）
const bubblePositions = [
  { x: -110, y: -40 },
  { x: 90, y: -50 },
  { x: -120, y: 50 },
  { x: 100, y: 40 },
  { x: -20, y: -90 },
  { x: 10, y: 80 },
]

export default function CuriosityMap({ items }: CuriosityMapProps) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => {
      const cat = item.category ?? 'その他'
      counts[cat] = (counts[cat] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [items])

  if (items.length === 0) return null

  const total = items.length
  const dominant = stats[0]?.[0] ?? 'その他'
  const config = categoryConfig[dominant as keyof typeof categoryConfig] ?? categoryConfig['その他']

  const maxCount = stats[0]?.[1] ?? 1

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 overflow-hidden">
      <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-6 text-center">
        あなたの好奇心マップ
      </p>

      {/* バブルマップ */}
      <div className="relative flex items-center justify-center" style={{ height: 240 }}>
        {/* 中央キャラ */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md"
            style={{ backgroundColor: config.bg }}
          >
            {config.char}
          </div>
          <p className="mt-2 text-xs font-semibold text-gray-600">{config.label}</p>
        </motion.div>

        {/* カテゴリバブル */}
        {stats.slice(0, 6).map(([cat, count], i) => {
          const catConfig = categoryConfig[cat as keyof typeof categoryConfig] ?? categoryConfig['その他']
          const size = 36 + (count / maxCount) * 32
          const pos = bubblePositions[i] ?? { x: 0, y: 0 }

          return (
            <motion.div
              key={cat}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
                width: size,
                height: size,
                backgroundColor: catConfig.bg,
                borderRadius: '50%',
              }}
              className="flex items-center justify-center cursor-default"
              title={`${cat}: ${count}件`}
            >
              <span style={{ fontSize: size * 0.4 }}>{catConfig.char}</span>
            </motion.div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {stats.map(([cat, count]) => {
          const catConfig = categoryConfig[cat as keyof typeof categoryConfig] ?? categoryConfig['その他']
          return (
            <div key={cat} className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catConfig.color }} />
              {cat} {count}件
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">合計 {total} 件の好奇心を記録中</p>
    </div>
  )
}
