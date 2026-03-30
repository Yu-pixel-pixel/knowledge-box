import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import type { KnowledgeItem } from '@/lib/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialItems: KnowledgeItem[] = []
  let initialTotal = 0
  let initialTodayCount = 0
  let initialCuriosityType: string | undefined

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
  }

  return (
    <HomeClient
      isLoggedIn={!!user}
      initialItems={initialItems}
      initialTotal={initialTotal}
      initialTodayCount={initialTodayCount}
      initialCuriosityType={initialCuriosityType}
    />
  )
}
