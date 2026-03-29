import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Category, AnalysisResult } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// =====================================================
// POST /api/knowledge
// body: { question: string }
// 1. Claude で要約・タグ生成
// 2. Supabase に保存
// 3. 5件到達時はミニ分析も生成して返す
// =====================================================
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { question } = await request.json()
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  // 月間保存数チェック（無料ユーザー: 30件上限）
  const { data: userData } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', user.id)
    .single()

  if (!userData?.is_premium) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('knowledge_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= 30) {
      return NextResponse.json({ error: 'monthly_limit_reached' }, { status: 429 })
    }
  }

  // ── Step 1: 要約・タグ生成 ──
  let summary = ''
  let tags: string[] = []
  let category: Category = 'その他'

  try {
    const summaryRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `以下の質問・トピックについて、必ずJSON形式のみで回答してください。余分な文章は一切不要です。

質問: ${question}

出力形式（このJSONのみ）:
{
  "summary": "200字以内の日本語要約",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "category": "科学|歴史|技術|社会|芸術|その他のいずれか1つ"
}`,
        },
      ],
    })

    const raw = summaryRes.content[0].type === 'text' ? summaryRes.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      summary = parsed.summary ?? ''
      tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : []
      category = parsed.category ?? 'その他'
    }
  } catch (e) {
    console.error('Claude summary error:', e)
    summary = question.slice(0, 200)
  }

  // ── Step 2: Supabase に保存 ──
  const { data: newItem, error: insertError } = await supabase
    .from('knowledge_items')
    .insert({ user_id: user.id, question, summary, tags, category })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // ── Step 3: 合計件数を確認し、5の倍数なら分析 ──
  const { count: totalCount } = await supabase
    .from('knowledge_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const total = totalCount ?? 0
  let analysis: AnalysisResult | null = null

  const milestones = [5, 20, 50, 100]
  if (milestones.includes(total)) {
    const { data: recent } = await supabase
      .from('knowledge_items')
      .select('question, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(total)

    try {
      const analysisRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `以下はユーザーが気になって調べたトピック一覧です。必ずJSON形式のみで分析してください。

トピック一覧:
${recent?.map((r) => `- [${r.category}] ${r.question}`).join('\n')}

出力形式（このJSONのみ）:
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "tendency": "あなたの脳内を一言で表すと〇〇型です",
  "message": "ユーザーへの一言コメント（ポジティブに、100字以内）"
}`,
          },
        ],
      })

      const raw = analysisRes.content[0].type === 'text' ? analysisRes.content[0].text : ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])

        await supabase.from('analyses').insert({
          user_id: user.id,
          trigger_count: total,
          result: analysis,
        })
      }
    } catch (e) {
      console.error('Claude analysis error:', e)
    }
  }

  return NextResponse.json({ item: newItem, analysis, total })
}

// =====================================================
// GET /api/knowledge
// ユーザーの knowledge_items 一覧を返す
// =====================================================
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ data: items, count: total }, { count: todayCount }] = await Promise.all([
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
  ])

  return NextResponse.json({ items: items ?? [], total: total ?? 0, todayCount: todayCount ?? 0 })
}
