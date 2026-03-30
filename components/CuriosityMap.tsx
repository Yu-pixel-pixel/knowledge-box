'use client'

import { useMemo, useRef, useEffect } from 'react'
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

interface Star {
  x: number
  y: number
  r: number
  color: string
  alpha: number
  twinkleOffset: number
}

export default function CuriosityMap({ items, curiosityType }: CuriosityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const { stars, dominant, total } = useMemo(() => {
    if (items.length === 0) return { stars: [], dominant: 'その他', total: 0 }

    const counts: Record<string, number> = {}
    items.forEach((item) => {
      const cat = item.category ?? 'その他'
      counts[cat] = (counts[cat] ?? 0) + 1
    })

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'その他'

    // 各アイテムを星に変換（シード固定でランダム配置）
    const stars: Star[] = items.map((item, i) => {
      const seed = i * 2654435761
      const x = 0.1 + ((seed % 1000) / 1000) * 0.8
      const y = 0.1 + (((seed >> 8) % 1000) / 1000) * 0.8
      const cat = item.category ?? 'その他'
      return {
        x,
        y,
        r: 2 + ((seed % 3)),
        color: categoryColors[cat] ?? '#4ECDC4',
        alpha: 0.6 + ((seed % 40) / 100),
        twinkleOffset: (seed % 628) / 100,
      }
    })

    return { stars, dominant, total: items.length }
  }, [items])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    let frame = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // 背景（深宇宙）
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7)
      bg.addColorStop(0, '#1a1a2e')
      bg.addColorStop(1, '#0d0d1a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // 星雲っぽい光
      const nebula = ctx.createRadialGradient(W * 0.6, H * 0.3, 0, W * 0.6, H * 0.3, W * 0.4)
      nebula.addColorStop(0, 'rgba(78, 205, 196, 0.06)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, W, H)

      // 背景の小さな固定星
      for (let i = 0; i < 60; i++) {
        const seed = i * 1234567
        const bx = ((seed % 1000) / 1000) * W
        const by = (((seed >> 4) % 1000) / 1000) * H
        const br = 0.5 + (seed % 10) / 10
        const twinkle = 0.3 + 0.3 * Math.sin(frame * 0.02 + i)
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${twinkle})`
        ctx.fill()
      }

      // 知識の星
      stars.forEach((star) => {
        const sx = star.x * W
        const sy = star.y * H
        const twinkle = star.alpha + 0.2 * Math.sin(frame * 0.03 + star.twinkleOffset)

        // グロー
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.r * 4)
        glow.addColorStop(0, star.color + '88')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sx, sy, star.r * 4, 0, Math.PI * 2)
        ctx.fill()

        // 星本体
        ctx.beginPath()
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2)
        ctx.fillStyle = star.color + Math.round(twinkle * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [stars])

  if (items.length === 0) return null

  const displayType = curiosityType ?? `${dominant}型の好奇心`

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 宇宙キャンバス */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block', minHeight: 300 }}
        />

        {/* 上部ラベル */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
            Universe
          </p>
        </div>

        {/* カテゴリ凡例（右上） */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end pointer-events-none">
          {Object.entries(categoryColors).map(([cat, color]) => {
            const count = items.filter((i) => (i.category ?? 'その他') === cat).length
            if (count === 0) return null
            return (
              <div key={cat} className="flex items-center gap-1">
                <span className="text-white/50 text-xs">{cat} {count}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* 好奇心タイプカード */}
      <div className="bg-[#0d0d1a] border-t border-white/10 px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{categoryChar[dominant] ?? '✨'}</span>
          <div>
            <p className="text-white/40 text-xs mb-0.5">あなたの好奇心タイプ</p>
            <p className="text-white font-semibold text-base leading-snug">{displayType}</p>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-3 text-right">{total}個の星を記録中</p>
      </div>
    </div>
  )
}
