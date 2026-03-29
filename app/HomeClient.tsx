'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import KnowledgeInput from '@/components/KnowledgeInput'
import KnowledgeCard from '@/components/KnowledgeCard'
import AnalysisModal from '@/components/AnalysisModal'
import AuthButton from '@/components/AuthButton'
import Counter from '@/components/Counter'
import type { KnowledgeItem, AnalysisResult } from '@/lib/types'

interface HomeClientProps {
  isLoggedIn: boolean
  initialItems: KnowledgeItem[]
  initialTotal: number
  initialTodayCount: number
}

export default function HomeClient({
  isLoggedIn,
  initialItems,
  initialTotal,
  initialTodayCount,
}: HomeClientProps) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ result: AnalysisResult; count: number } | null>(null)

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
          setError('今月の保存上限（30件）に達しました。来月また使えます！')
        } else {
          setError('うまくいかなかったみたい。もう一度試してみてください。')
        }
        return
      }

      const newItem = data.item as KnowledgeItem
      setItems((prev) => [newItem, ...prev])
      setNewItemId(newItem.id)
      setTotal(data.total)
      setTodayCount((prev) => prev + 1)

      if (data.analysis) {
        setAnalysis({ result: data.analysis, count: data.total })
      }
    } catch {
      setError('うまくいかなかったみたい。ネットワークを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-[#FAFAFA]/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Stockle</h1>
            {isLoggedIn && (
              <Counter todayCount={todayCount} total={total} />
            )}
          </div>
          <AuthButton isLoggedIn={isLoggedIn} />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 入力エリア */}
        <section>
          {!isLoggedIn && (
            <p className="text-center text-sm text-gray-500 mb-3">
              Googleログインで保存・履歴閲覧ができます
            </p>
          )}
          <KnowledgeInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isLoggedIn={isLoggedIn}
            onLoginRequest={handleLoginRequest}
          />
          {error && (
            <p className="mt-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-2">{error}</p>
          )}
        </section>

        {/* カード一覧 */}
        {items.length > 0 ? (
          <section className="space-y-3">
            {items.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                isNew={item.id === newItemId}
              />
            ))}
          </section>
        ) : isLoggedIn ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm">気になったことを入力してみよう</p>
          </div>
        ) : null}
      </main>

      {/* ミニ分析モーダル */}
      {analysis && (
        <AnalysisModal
          analysis={analysis.result}
          triggerCount={analysis.count}
          onClose={() => setAnalysis(null)}
        />
      )}
    </div>
  )
}
