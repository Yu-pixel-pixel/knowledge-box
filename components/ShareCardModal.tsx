'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult } from '@/lib/types'

interface ShareCardModalProps {
  curiosityType: string
  latestAnalysis?: AnalysisResult | null
  total: number
  categoryStats: { cat: string; pct: number }[]
  onClose: () => void
}

const categoryColors: Record<string, string> = {
  技術: '#A78BFA',
  科学: '#60A5FA',
  歴史: '#FBBF24',
  社会: '#34D399',
  芸術: '#F472B6',
  その他: '#4ECDC4',
}

const categoryChar: Record<string, string> = {
  技術: '🤖',
  科学: '🔬',
  歴史: '🦉',
  社会: '🌍',
  芸術: '🎨',
  その他: '✨',
}

export default function ShareCardModal({
  curiosityType,
  latestAnalysis,
  total,
  categoryStats,
  onClose,
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!cardRef.current) return
    setIsSharing(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], 'my-universe.png', { type: 'image/png' })
        const shareText = `${curiosityType}\n\n気になるギモンが${total}個集まりました🌌\n\n#Stockle`

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText })
        } else {
          // fallback: download
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'my-universe.png'
          a.click()
          URL.revokeObjectURL(url)
        }
        setIsSharing(false)
      }, 'image/png')
    } catch {
      setIsSharing(false)
    }
  }

  const top3 = categoryStats.slice(0, 3)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm flex flex-col items-center gap-4"
        >
          {/* シェアカード本体 */}
          <div
            ref={cardRef}
            className="w-full rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0a0a14 100%)',
              padding: '32px 28px',
            }}
          >
            {/* 背景の星（装飾） */}
            <div className="relative">
              {Array.from({ length: 20 }).map((_, i) => {
                const seed = i * 1234567
                return (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: 1.5,
                      height: 1.5,
                      left: `${(seed % 100)}%`,
                      top: `${((seed >> 4) % 100)}%`,
                      opacity: 0.15 + (i % 3) * 0.1,
                    }}
                  />
                )
              })}

              {/* ロゴ */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[#4ECDC4] text-sm font-bold tracking-widest uppercase">Stockle</span>
                <span className="text-white/20 text-xs">/ My Universe</span>
              </div>

              {/* 好奇心タイプ */}
              <div className="mb-6">
                <p className="text-white/40 text-xs mb-2 tracking-wide">あなたってこういう人</p>
                <p className="text-white font-bold text-xl leading-snug">{curiosityType}</p>
              </div>

              {/* AIメッセージ */}
              {latestAnalysis?.message && (
                <div className="mb-6 border-l-2 border-[#4ECDC4]/40 pl-3">
                  <p className="text-white/60 text-xs leading-relaxed">{latestAnalysis.message}</p>
                </div>
              )}

              {/* カテゴリTOP3 */}
              <div className="space-y-2 mb-6">
                {top3.map(({ cat, pct }) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-white/50 text-xs w-16">
                      {categoryChar[cat]}{cat}
                    </span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: categoryColors[cat] ?? '#4ECDC4',
                        }}
                      />
                    </div>
                    <span className="text-white/30 text-xs w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>

              {/* フッター */}
              <div className="flex items-center justify-between">
                <p className="text-white/25 text-xs">{total}個のギモンを記録中</p>
                <p className="text-[#4ECDC4]/40 text-xs">stockle.app</p>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full py-3.5 bg-[#4ECDC4] hover:bg-[#3bbdb4] disabled:opacity-60 text-white font-bold rounded-2xl transition-colors"
            >
              {isSharing ? '生成中...' : '📤 シェアする'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
