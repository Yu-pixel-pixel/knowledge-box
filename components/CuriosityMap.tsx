'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeItem } from '@/lib/types'

interface CuriosityMapProps {
  items: KnowledgeItem[]
  curiosityType?: string
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

interface StarData {
  x: number
  y: number
  r: number
  color: string
  alpha: number
  twinkleOffset: number
  item: KnowledgeItem
}

interface PopupState {
  item: KnowledgeItem
  x: number
  y: number
}

export default function CuriosityMap({ items, curiosityType }: CuriosityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const starsRef = useRef<StarData[]>([])
  const [popup, setPopup] = useState<PopupState | null>(null)

  const { stars, dominant, total } = useMemo(() => {
    if (items.length === 0) return { stars: [], dominant: 'その他', total: 0 }

    const counts: Record<string, number> = {}
    items.forEach((item) => {
      const cat = item.category ?? 'その他'
      counts[cat] = (counts[cat] ?? 0) + 1
    })

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'その他'

    const stars: StarData[] = items.map((item, i) => {
      const seed = i * 2654435761
      const x = 0.08 + ((seed % 1000) / 1000) * 0.84
      const y = 0.08 + (((seed >> 8) % 1000) / 1000) * 0.84
      const cat = item.category ?? 'その他'
      return {
        x,
        y,
        r: 3 + (seed % 3),
        color: categoryColors[cat] ?? '#4ECDC4',
        alpha: 0.6 + ((seed % 40) / 100),
        twinkleOffset: (seed % 628) / 100,
        item,
      }
    })

    return { stars, dominant, total: items.length }
  }, [items])

  // starsRefを最新に保つ
  useEffect(() => {
    starsRef.current = stars
  }, [stars])

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    let frame = 0

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight

      ctx.clearRect(0, 0, W, H)

      // 背景
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8)
      bg.addColorStop(0, '#1a1a2e')
      bg.addColorStop(1, '#0a0a14')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // 星雲
      const nebula = ctx.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.35, W * 0.45)
      nebula.addColorStop(0, 'rgba(78,205,196,0.07)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, W, H)

      const nebula2 = ctx.createRadialGradient(W * 0.2, H * 0.7, 0, W * 0.2, H * 0.7, W * 0.3)
      nebula2.addColorStop(0, 'rgba(167,139,250,0.05)')
      nebula2.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, W, H)

      // 背景の小さな固定星
      for (let i = 0; i < 80; i++) {
        const s = i * 1234567
        const bx = ((s % 1000) / 1000) * W
        const by = (((s >> 4) % 1000) / 1000) * H
        const br = 0.3 + (s % 10) / 15
        const tw = 0.2 + 0.25 * Math.sin(frame * 0.015 + i)
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${tw})`
        ctx.fill()
      }

      const currentStars = starsRef.current

      // 同カテゴリの星を線で繋ぐ（星座）
      const byCat: Record<string, StarData[]> = {}
      currentStars.forEach((star) => {
        const cat = star.item.category ?? 'その他'
        if (!byCat[cat]) byCat[cat] = []
        byCat[cat].push(star)
      })

      Object.entries(byCat).forEach(([, catStars]) => {
        if (catStars.length < 2) return
        for (let i = 0; i < catStars.length - 1; i++) {
          const a = catStars[i]
          const b = catStars[i + 1]
          const ax = a.x * W
          const ay = a.y * H
          const bx2 = b.x * W
          const by2 = b.y * H
          const dist = Math.hypot(bx2 - ax, by2 - ay)
          // 近い星だけ繋ぐ
          if (dist < W * 0.35) {
            ctx.beginPath()
            ctx.moveTo(ax, ay)
            ctx.lineTo(bx2, by2)
            ctx.strokeStyle = a.color + '30'
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      })

      // 知識の星
      currentStars.forEach((star) => {
        const sx = star.x * W
        const sy = star.y * H
        const twinkle = star.alpha + 0.15 * Math.sin(frame * 0.025 + star.twinkleOffset)

        // グロー
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.r * 5)
        glow.addColorStop(0, star.color + 'aa')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sx, sy, star.r * 5, 0, Math.PI * 2)
        ctx.fill()

        // 星本体
        ctx.beginPath()
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2)
        const alphaHex = Math.round(Math.min(twinkle, 1) * 255).toString(16).padStart(2, '0')
        ctx.fillStyle = star.color + alphaHex
        ctx.fill()
      })

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [stars])

  // タップ・クリックで星を検出
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight

    const hit = starsRef.current.find((star) => {
      const sx = star.x * W
      const sy = star.y * H
      return Math.hypot(x - sx, y - sy) < star.r * 6 + 8
    })

    if (hit) {
      setPopup({ item: hit.item, x: e.clientX, y: e.clientY })
    } else {
      setPopup(null)
    }
  }, [])

  if (items.length === 0) return null

  const displayType = curiosityType ?? `${dominant}型の好奇心`
  const dominantItems = items.filter((i) => (i.category ?? 'その他') === dominant)
  const topTags = [...new Set(dominantItems.flatMap((i) => i.tags ?? []))].slice(0, 3)
  const reason = topTags.length > 0
    ? `なぜなら、「${topTags.join('」「')}」への関心が特に多いからです`
    : `なぜなら、${dominant}分野の記録が最も多いからです`

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 宇宙キャンバス */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
          style={{ display: 'block', minHeight: 340 }}
        />

        {/* 上部ラベル */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <p className="text-xs text-white/30 font-medium tracking-widest uppercase">Universe</p>
        </div>

        {/* カテゴリ凡例 */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end pointer-events-none">
          {Object.entries(categoryColors).map(([cat, color]) => {
            const count = items.filter((i) => (i.category ?? 'その他') === cat).length
            if (count === 0) return null
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="text-white/40 text-xs">{cat} {count}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
            )
          })}
        </div>

        {/* タップヒント */}
        {total > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <p className="text-white/20 text-xs">星をタップしてみて</p>
          </div>
        )}
      </div>

      {/* 好奇心タイプカード */}
      <div className="bg-[#0d0d1a] border-t border-white/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{categoryChar[dominant] ?? '✨'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-xs mb-1">あなたの好奇心タイプ</p>
            <p className="text-white font-semibold text-base leading-snug">{displayType}</p>
            <p className="text-white/30 text-xs mt-1.5 leading-relaxed">{reason}</p>
          </div>
        </div>
        <p className="text-white/20 text-xs mt-3 text-right">{total}個の星を記録中</p>
      </div>

      {/* 星タップポップアップ */}
      <AnimatePresence>
        {popup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setPopup(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed z-50 w-72 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl p-4"
              style={{
                left: Math.min(popup.x + 12, window.innerWidth - 300),
                top: Math.min(popup.y - 20, window.innerHeight - 200),
              }}
            >
              {/* カテゴリバッジ */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{categoryChar[popup.item.category ?? 'その他'] ?? '✨'}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: (categoryColors[popup.item.category ?? 'その他'] ?? '#4ECDC4') + '22',
                    color: categoryColors[popup.item.category ?? 'その他'] ?? '#4ECDC4',
                  }}
                >
                  {popup.item.category ?? 'その他'}
                </span>
              </div>

              {/* 質問 */}
              <p className="text-white text-sm font-medium leading-snug mb-2">
                {popup.item.question}
              </p>

              {/* 要約 */}
              {popup.item.summary && (
                <p className="text-white/50 text-xs leading-relaxed mb-2">
                  {popup.item.summary}
                </p>
              )}

              {/* タグ */}
              {popup.item.tags && popup.item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {popup.item.tags.map((tag) => (
                    <span key={tag} className="text-xs text-[#4ECDC4]/70 bg-[#4ECDC4]/10 px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 閉じる */}
              <button
                onClick={() => setPopup(null)}
                className="mt-3 w-full text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                閉じる
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
