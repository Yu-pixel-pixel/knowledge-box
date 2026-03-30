'use client'

import { motion } from 'framer-motion'

interface LandingPageProps {
  onLogin: () => void
}

const steps = [
  {
    number: '01',
    icon: '💭',
    title: '気になったことを入力',
    desc: '「なぜ空は青いの？」「ブラックホールって何？」\nどんな小さなギモンでも OK',
  },
  {
    number: '02',
    icon: '✨',
    title: 'AIが瞬時に整理',
    desc: 'カテゴリ分類・キーワード抽出・要約を\n自動で生成します',
  },
  {
    number: '03',
    icon: '🌌',
    title: 'あなただけのUniverseが広がる',
    desc: 'ギモンが蓄積するほど、あなたの知的個性が\n宇宙のように可視化されます',
  },
]

const categoryColors: Record<string, string> = {
  技術: '#8b5cf6',
  科学: '#3b82f6',
  歴史: '#f59e0b',
  社会: '#10b981',
  芸術: '#ec4899',
}

function MiniUniverse() {
  const stars = [
    { x: 50, y: 45, size: 8, category: '科学', label: 'なぜ空は青い？' },
    { x: 75, y: 30, size: 6, category: '技術', label: 'AIの仕組みとは' },
    { x: 25, y: 35, size: 7, category: '歴史', label: '江戸時代の暮らし' },
    { x: 65, y: 65, size: 5, category: '社会', label: '経済格差の原因' },
    { x: 35, y: 68, size: 9, category: '芸術', label: 'なぜ音楽は感動する' },
    { x: 82, y: 58, size: 4, category: '技術', label: 'ブロックチェーン' },
    { x: 18, y: 60, size: 5, category: '科学', label: 'ブラックホール' },
    { x: 55, y: 22, size: 6, category: '社会', label: '民主主義の歴史' },
    { x: 42, y: 52, size: 11, category: '科学', label: 'ビッグバンとは' },
    { x: 70, y: 48, size: 4, category: '芸術', label: '俳句の美学' },
    { x: 28, y: 20, size: 5, category: '技術', label: '量子コンピュータ' },
    { x: 88, y: 38, size: 6, category: '歴史', label: 'シルクロードとは' },
  ]

  const lines = [
    [0, 2], [0, 8], [1, 5], [3, 4], [4, 6], [6, 8],
  ]

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#0a0a1a]">
      {/* 背景の星 */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() > 0.7 ? 2 : 1,
            height: Math.random() > 0.7 ? 2 : 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.15 + Math.random() * 0.3,
          }}
        />
      ))}

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map(([a, b], i) => {
          const s1 = stars[a]
          const s2 = stars[b]
          return (
            <line
              key={i}
              x1={s1.x} y1={s1.y}
              x2={s2.x} y2={s2.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.4"
            />
          )
        })}
      </svg>

      {stars.map((star, i) => {
        const color = categoryColors[star.category] ?? '#888'
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: color,
              boxShadow: `0 0 ${star.size * 2}px ${color}88`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}

      {/* カテゴリ凡例 */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-white/50 text-[9px]">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ヘッダー */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">Stockle</span>
          <button
            onClick={onLogin}
            className="px-5 py-2 bg-[#4ECDC4] hover:bg-[#3bbdb4] text-white text-sm font-medium rounded-full transition-colors"
          >
            はじめる
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4ECDC4]/10 text-[#2ba89e] text-sm rounded-full mb-8 font-medium">
            🌌 好奇心を、宇宙にしよう
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            気になるギモンが、
            <br />
            <span className="text-[#4ECDC4]">世界をもっとくっきりさせる</span>
          </h1>

          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            日常の疑問を記録するだけ。
            <br />
            AIが整理して、あなただけの知的宇宙を作ります。
          </p>

          <button
            onClick={onLogin}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-2xl shadow-sm hover:shadow-md transition-all text-base"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Googleで無料ではじめる
          </button>

          <p className="mt-4 text-xs text-gray-400">無料・登録30秒・クレカ不要</p>
        </motion.div>
      </section>

      {/* Universe プレビュー */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <MiniUniverse />
          <p className="text-center text-xs text-gray-400 mt-3">
            ↑ ギモンが星になって、あなただけのUniverseが広がります
          </p>
        </motion.div>
      </section>

      {/* 3ステップ */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-12">
            使い方はシンプル
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-xs font-bold text-[#4ECDC4] mb-2 tracking-widest">{step.number}</div>
                <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: '🔬',
              title: 'AIが即座に分類・要約',
              desc: '科学・技術・歴史・社会・芸術の5カテゴリに自動分類。長い疑問も200字に凝縮。',
            },
            {
              icon: '🌌',
              title: '知的個性が見えるUniverse',
              desc: 'レーダーチャートとパーセンテージで、あなたの好奇心のパターンを可視化。',
            },
            {
              icon: '🧠',
              title: 'AI好奇心タイプ診断',
              desc: '記録が増えるほど、あなただけの好奇心タイプをAIが分析。',
            },
            {
              icon: '📱',
              title: 'スマホでもサクサク',
              desc: 'ホーム画面に追加してアプリのように使えます（PWA対応）。',
            },
          ].map((feat) => (
            <div key={feat.title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-2xl mb-3">{feat.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 最終CTA */}
      <section className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#4ECDC4]/5 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-3xl font-bold text-gray-800 mb-4">
            あなたのギモンは、
            <br />
            あなたの知性の地図です。
          </p>
          <p className="text-gray-500 mb-10">
            記録するたびに、世界がくっきりしてきます。
          </p>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#4ECDC4] hover:bg-[#3bbdb4] text-white font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full p-0.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Googleで無料ではじめる
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">© 2025 Stockle</p>
      </footer>
    </div>
  )
}
