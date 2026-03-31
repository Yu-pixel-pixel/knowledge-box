import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import type { KnowledgeItem } from '@/lib/types'

function calcStreak(items: { created_at: string }[]): number {
  if (items.length === 0) return 0

  // 日付ごとにグループ化（JST）
  const days = new Set(
    items.map((item) => {
      const d = new Date(item.created_at)
      // UTC+9
      d.setTime(d.getTime() + 9 * 60 * 60 * 1000)
      return d.toISOString().slice(0, 10)
    })
  )

  const today = new Date()
  today.setTime(today.getTime() + 9 * 60 * 60 * 1000)
  const todayStr = today.toISOString().slice(0, 10)

  let streak = 0
  let cursor = new Date(today)

  // 今日記録がなければ昨日からカウント
  if (!days.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    if (!days.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialItems: KnowledgeItem[] = []
  let initialTotal = 0
  let initialTodayCount = 0
  let initialCuriosityType: string | undefined
  let initialLatestAnalysis = null
  let initialStreak = 0

  if (user) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [{ data: items, count: total }, { count: todayCount }, { data: latestAnalysis }] =
      await Promise.all([
        supabase
          .from('knowledge_items')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('knowledge_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString()),
        supabase
          .from('analyses')
          .select('result')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])

    initialItems = (items ?? []) as KnowledgeItem[]
    initialTotal = total ?? 0
    initialTodayCount = todayCount ?? 0
    initialCuriosityType = latestAnalysis?.[0]?.result?.tendency ?? undefined
    initialLatestAnalysis = latestAnalysis?.[0]?.result ?? null
    initialStreak = calcStreak(items ?? [])
  }

  return (
    <HomeClient
      isLoggedIn={!!user}
      initialItems={initialItems}
      initialTotal={initialTotal}
      initialTodayCount={initialTodayCount}
      initialCuriosityType={initialCuriosityType}
      initialLatestAnalysis={initialLatestAnalysis}
      initialStreak={initialStreak}
    />
  )
}
