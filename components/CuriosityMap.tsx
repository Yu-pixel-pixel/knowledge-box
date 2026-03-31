'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeItem, AnalysisResult } from '@/lib/types'
import ShareCardModal from '@/components/ShareCardModal'

interface CuriosityMapProps {
  items: KnowledgeItem[]
  curiosityType?: string
  latestAnalysis?: AnalysisResult | null
}

const CATEGORIES = ['技術', '科学', '歴史', '社会', '芸術'] as const

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

// ── レーダーチャート（SVG） ──────────────────────────
function RadarChart({ items }: { items: KnowledgeItem[] }) {
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = 80
  const n = CATEGORIES.length

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach((item) => {
      const cat = item.category ?? 'その他'
      c[cat] = (c[cat] ?? 0) + 1
    })
    return c
  }, [items])

  const max = Math.max(...CATEGORIES.map((c) => counts[c] ?? 0), 1)

  const points = CATEGORIES.map((cat, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const val = (counts[cat] ?? 0) / max
    return {
      cat,
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
      lx: cx + (r + 24) * Math.cos(angle),
      ly: cy + (r + 24) * Math.sin(angle),
      val,
    }
  })

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* グリッド */}
      {gridLevels.map((level) => {
        const gpts = CATEGORIES.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={gpts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        )
      })}

      {/* 軸線 */}
      {CATEGORIES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        )
      })}

      {/* データポリゴン */}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(78,205,196,0.15)"
        stroke="#4ECDC4"
        strokeWidth={1.5}
      />

      {/* 頂点ドット */}
      {points.map((p) => (
        <circle
          key={p.cat}
          cx={p.x} cy={p.y} r={3}
          fill={categoryColors[p.cat] ?? '#4ECDC4'}
        />
      ))}

      {/* ラベル */}
      {points.map((p) => (
        <text
          key={p.cat}
          x={p.lx} y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="rgba(255,255,255,0.5)"
        >
          {categoryChar[p.cat]}{p.cat}
        </text>
      ))}
    </svg>
  )
}

// ── メインコンポーネント ──────────────────────────────
export default function CuriosityMap({ items, curiosityType, latestAnalysis }: CuriosityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const starsRef = useRef<StarData[]>([])
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)

  const { stars, dominant, total, categoryStats } = useMemo(() => {
    if (items.length === 0) return { stars: [], dominant: 'その他', total: 0, categoryStats: [] }

    const counts: Record<string, number> = {}
    items.forEach((item) => {
      const cat = item.category ?? 'その他'
      counts[cat] = (counts[cat] ?? 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const dominant = sorted[0]?.[0] ?? 'その他'
    const total = items.length

    const categoryStats = sorted.map(([cat, count]) => ({
      cat,
      count,
      pct: Math.round((count / total) * 100),
    }))

    const stars: StarData[] = items.map((item, i) => {
      const seed = i * 2654435761
      const x = 0.06 + ((seed % 1000) / 1000) * 0.88
      const y = 0.06 + (((seed >> 8) % 1000) / 1000) * 0.88
      const cat = item.category ?? 'その他'
      return {
        x, y,
        r: 2.5 + (seed % 3),
        color: categoryColors[cat] ?? '#4ECDC4',
        alpha: 0.6 + ((seed % 40) / 100),
        twinkleOffset: (seed % 628) / 100,
        item,
      }
    })

    return { stars, dominant, total, categoryStats }
  }, [items])

  useEffect(() => { starsRef.current = stars }, [stars])

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

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
      const nebula = ctx.createRadialGradient(W * 0.6, H * 0.4, 0, W * 0.6, H * 0.4, W * 0.4)
      nebula.addColorStop(0, 'rgba(78,205,196,0.07)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, W, H)

      // 背景の固定星
      for (let i = 0; i < 60; i++) {
        const s = i * 1234567
        const bx = ((s % 1000) / 1000) * W
        const by = (((s >> 4) % 1000) / 1000) * H
        const tw = 0.15 + 0.2 * Math.sin(frame * 0.015 + i)
        ctx.beginPath()
        ctx.arc(bx, by, 0.4 + (s % 8) / 12, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${tw})`
        ctx.fill()
      }

      // 同カテゴリの星を線で繋ぐ
      const byCat: Record<string, StarData[]> = {}
      starsRef.current.forEach((star) => {
        const cat = star.item.category ?? 'その他'
        if (!byCat[cat]) byCat[cat] = []
        byCat[cat].push(star)
      })
      Object.values(byCat).forEach((catStars) => {
        for (let i = 0; i < catStars.length - 1; i++) {
          const a = catStars[i], b = catStars[i + 1]
          const dist = Math.hypot((b.x - a.x) * W, (b.y - a.y) * H)
          if (dist < W * 0.32) {
            ctx.beginPath()
            ctx.moveTo(a.x * W, a.y * H)
            ctx.lineTo(b.x * W, b.y * H)
            ctx.strokeStyle = a.color + '28'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })

      // 知識の星
      starsRef.current.forEach((star) => {
        const sx = star.x * W, sy = star.y * H
        const tw = star.alpha + 0.15 * Math.sin(frame * 0.025 + star.twinkleOffset)
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.r * 5)
        glow.addColorStop(0, star.color + '99')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sx, sy, star.r * 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2)
        ctx.fillStyle = star.color + Math.round(Math.min(tw, 1) * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [stars])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight

    const hit = starsRef.current.find((star) =>
      Math.hypot(x - star.x * W, y - star.y * H) < star.r * 6 + 10
    )
    if (hit) setPopup({ item: hit.item, x: e.clientX, y: e.clientY })
    else setPopup(null)
  }, [])

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a14] px-8 text-center gap-5">
      {/* ゴースト星空 */}
      <div className="relative w-48 h-48">
        {Array.from({ length: 12 }).map((_, i) => {
          const seed = i * 9999
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: 4 + (seed % 6),
                height: 4 + (seed % 6),
                left: `${(seed % 100)}%`,
                top: `${((seed * 3) % 100)}%`,
                animationDelay: `${(i * 0.3) % 2}s`,
              }}
            />
          )
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/20 text-4xl">🌌</p>
        </div>
      </div>
      <div>
        <p className="text-white/60 font-medium mb-2">あなたの宇宙はまだ眠っています</p>
        <p className="text-white/25 text-sm leading-relaxed">ギモンメモタブから最初のギモンを記録すると<br />ここに星が生まれます</p>
      </div>
    </div>
  )

  const displayType = curiosityType ?? `${dominant}型の好奇心`

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a14]">
      {/* 星空マップ */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
          style={{ height: 200, display: 'block' }}
        />
        <div className="absolute top-3 left-4 pointer-events-none">
          <p className="text-xs text-white/25 tracking-widest uppercase">Universe</p>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-white/20 text-xs">星をタップすると、そのギモンが見えます</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* レーダーチャート */}
        <section>
          <p className="text-white/40 text-xs font-medium mb-3 tracking-wide uppercase">ギモンの内訳</p>
          <RadarChart items={items} />

          {/* % 内訳バー */}
          <div className="space-y-2 mt-4">
            {categoryStats.map(({ cat, count, pct }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-white/50 text-xs w-16 shrink-0">{categoryChar[cat]}{cat}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: categoryColors[cat] ?? '#4ECDC4' }}
                  />
                </div>
                <span className="text-white/30 text-xs w-12 text-right shrink-0">{count}個 {pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* 好奇心タイプ */}
        <section className="bg-white/5 rounded-2xl p-4">
          <p className="text-white/30 text-xs mb-2 uppercase tracking-wide">あなたってこういう人</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryChar[dominant] ?? '✨'}</span>
            <p className="text-white font-semibold text-base">{displayType}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-white/30 text-xs">これまでに{total}個のギモンを記録してる</p>
            <button
              onClick={() => setShowShareCard(true)}
              className="text-xs text-[#4ECDC4]/60 hover:text-[#4ECDC4] transition-colors px-3 py-1 rounded-full border border-[#4ECDC4]/20 hover:border-[#4ECDC4]/40"
            >
              📤 シェア
            </button>
          </div>
        </section>

        {/* AIメッセージ */}
        {latestAnalysis ? (
          <section className="bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 rounded-2xl p-4">
            <p className="text-[#4ECDC4]/60 text-xs mb-2 uppercase tracking-wide">Stockleより</p>
            <p className="text-white/80 text-sm leading-relaxed">{latestAnalysis.message}</p>
            {latestAnalysis.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {latestAnalysis.keywords.map((kw) => (
                  <span key={kw} className="text-xs bg-[#4ECDC4]/10 text-[#4ECDC4]/70 px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </section>
        ) : items.length < 5 ? (
          <section className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(items.length / 5) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-[#4ECDC4]/60 rounded-full"
                />
              </div>
              <span className="text-white/30 text-xs shrink-0">{items.length} / 5</span>
            </div>
            <p className="text-white/40 text-sm">
              あと<span className="text-[#4ECDC4]/70 font-bold">{5 - items.length}個</span>記録すると、あなたの傾向が見えてきます
            </p>
          </section>
        ) : null}

      </div>

      {/* シェアカードモーダル */}
      {showShareCard && (
        <ShareCardModal
          curiosityType={displayType}
          latestAnalysis={latestAnalysis}
          total={total}
          categoryStats={categoryStats}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* 星タップポップアップ */}
      <AnimatePresence>
        {popup && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                top: Math.min(popup.y - 20, window.innerHeight - 220),
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{categoryChar[popup.item.category ?? 'その他'] ?? '✨'}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: (categoryColors[popup.item.category ?? 'その他'] ?? '#4ECDC4') + '22',
                    color: categoryColors[popup.item.category ?? 'その他'] ?? '#4ECDC4',
                  }}>
                  {popup.item.category ?? 'その他'}
                </span>
              </div>
              <p className="text-white text-sm font-medium leading-snug mb-2">{popup.item.question}</p>
              {popup.item.summary && (
                <p className="text-white/50 text-xs leading-relaxed mb-2">{popup.item.summary}</p>
              )}
              {popup.item.tags && popup.item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {popup.item.tags.map((tag) => (
                    <span key={tag} className="text-xs text-[#4ECDC4]/70 bg-[#4ECDC4]/10 px-1.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setPopup(null)} className="mt-3 w-full text-xs text-white/25 hover:text-white/50 transition-colors">
                閉じる
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
