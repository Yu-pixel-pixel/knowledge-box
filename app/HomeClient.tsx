'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import KnowledgeInput from '@/components/KnowledgeInput'
import KnowledgeCard from '@/components/KnowledgeCard'
import AnalysisModal from '@/components/AnalysisModal'
import SaveResultModal from '@/components/SaveResultModal'
import CuriosityMap from '@/components/CuriosityMap'
import AuthButton from '@/components/AuthButton'
import Counter from '@/components/Counter'
import LandingPage from '@/components/LandingPage'
import UpgradeModal from '@/components/UpgradeModal'
import type { KnowledgeItem, AnalysisResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface HomeClientProps {
  isLoggedIn: boolean
  initialItems: KnowledgeItem[]
  initialTotal: number
  initialTodayCount: number
  initialCuriosityType?: string
  initialLatestAnalysis?: AnalysisResult | null
  initialStreak: number
}

type Tab = 'memo' | 'universe'

export default function HomeClient({
  isLoggedIn,
  initialItems,
  initialTotal,
  initialTodayCount,
  initialCuriosityType,
  initialLatestAnalysis,
  initialStreak,
}: HomeClientProps) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedItem, setSavedItem] = useState<KnowledgeItem | null>(null)
  const [analysis, setAnalysis] = useState<{ result: AnalysisResult; count: number } | null>(null)
  const [curiosityType, setCuriosityType] = useState<string | undefined>(initialCuriosityType)
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null | undefined>(initialLatestAnalysis)
  const [activeTab, setActiveTab] = useState<Tab>('memo')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [prefill, setPrefill] = useState<string | undefined>()
  const [streak, setStreak] = useState(initialStreak)

  const supabase = createClient()

  const handleLoginRequest = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleSubmit = async (question: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'monthly_limit_reached') {
          setShowUpgrade(true)
        } else {
          setError('うまくいかなかったみたい。もう一度試してみてください。')
        }
        return
      }

      const newItem = data.item as KnowledgeItem
      setItems((prev) => [newItem, ...prev])
      setTotal(data.total)
      setTodayCount((prev) => {
        if (prev === 0) setStreak((s) => s === 0 ? 1 : s)
        return prev + 1
      })
      setSavedItem(newItem)

      if (data.curiosityType) {
        setCuriosityType(data.curiosityType)
      }

      if (data.analysis) {
        setAnalysis({ result: data.analysis, count: data.total })
        setLatestAnalysis(data.analysis)
      }
    } catch {
      setError('うまくいかなかったみたい。ネットワークを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setTotal((prev) => prev - 1)
  }, [])

  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLoginRequest} />
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-[#FAFAFA]/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Stockle</h1>
            <Counter todayCount={todayCount} total={total} streak={streak} />
          </div>
          <AuthButton isLoggedIn={isLoggedIn} />
        </div>

        {/* タブ */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {(['memo', 'universe'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab ? 'text-[#4ECDC4]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'memo' ? 'ギモンメモ' : 'Universe'}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ECDC4] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* タブコンテンツ */}
      <AnimatePresence mode="wait">
        {activeTab === 'memo' ? (
          <motion.main
            key="memo"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6"
          >
            {/* 入力エリア */}
            <section>
              <KnowledgeInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isLoggedIn={isLoggedIn}
                onLoginRequest={handleLoginRequest}
                prefill={prefill}
              />
              {error && (
                <p className="mt-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-2">{error}</p>
              )}
            </section>

            {/* オンボーディング（0件のとき） */}
            {items.length === 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#4ECDC4]/8 to-[#4ECDC4]/3 rounded-2xl p-5 border border-[#4ECDC4]/15"
              >
                <p className="text-sm font-medium text-gray-700 mb-1">最初のギモンを入れてみよう 🔭</p>
                <p className="text-xs text-gray-400 mb-4">どんな小さなことでもOK。下のヒントをタップするとそのまま入力できます。</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'なぜ夢って覚えてないんだろう',
                    'お金ってそもそも何でできてるの？',
                    'なぜ人は音楽で感動するの？',
                    'AIって本当に考えてるの？',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setPrefill(q)}
                      className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-[#4ECDC4] hover:text-[#2ba89e] px-3 py-1.5 rounded-full transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* カード一覧 */}
            {items.length > 0 && (
              <section className="space-y-3">
                {items.map((item) => (
                  <KnowledgeCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                  />
                ))}
              </section>
            )}
          </motion.main>
        ) : (
          <motion.div
            key="universe"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <CuriosityMap items={items} curiosityType={curiosityType} latestAnalysis={latestAnalysis} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 保存直後の強調モーダル */}
      {savedItem && (
        <SaveResultModal
          item={savedItem}
          onClose={() => setSavedItem(null)}
        />
      )}

      {/* ミニ分析モーダル */}
      {analysis && !savedItem && (
        <AnalysisModal
          analysis={analysis.result}
          triggerCount={analysis.count}
          onClose={() => setAnalysis(null)}
        />
      )}

      {/* アップグレードモーダル */}
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  )
}
