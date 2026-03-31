import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Category, AnalysisResult } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { question } = await request.json()
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  // 月間保存数チェック
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
      messages: [{
        role: 'user',
        content: `以下の質問・トピックについて、必ずJSON形式のみで回答してください。

質問: ${question}

出力形式（このJSONのみ）:
{
  "summary": "200字以内の日本語要約",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "category": "科学|歴史|技術|社会|芸術|その他のいずれか1つ"
}`,
      }],
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

  // ── Step 2: 保存 ──
  const { data: newItem, error: insertError } = await supabase
    .from('knowledge_items')
    .insert({ user_id: user.id, question, summary, tags, category })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // ── Step 3: 全件取得して好奇心タイプを生成 ──
  const { data: allItems, count: totalCount } = await supabase
    .from('knowledge_items')
    .select('question, category', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const total = totalCount ?? 0
  let analysis: AnalysisResult | null = null
  let curiosityType: string | null = null

  // 3件以上でAI好奇心タイプを生成（3件ごとに更新）
  if (total >= 3 && total % 3 === 0) {
    try {
      const typeRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `以下はユーザーが気になって記録したギモン一覧です。
このユーザーの好奇心の傾向を、身近で具体的な「〇〇タイプ」という形で一言で表してください。
「技術型」のような抽象的な表現ではなく、その人の個性が伝わる表現にしてください。
例: 「なぜ？を止められない実験者タイプ」「社会の仕組みを解体したがる観察者タイプ」「テクノロジーと人間の境界を探るタイプ」

ギモン一覧:
${allItems?.slice(0, 20).map((r) => `- [${r.category}] ${r.question}`).join('\n')}

一言のみ回答してください（JSON不要、文章のみ）:`,
        }],
      })
      const raw = typeRes.content[0].type === 'text' ? typeRes.content[0].text.trim() : null
      if (raw) curiosityType = raw
    } catch (e) {
      console.error('Claude curiosity type error:', e)
    }
  }

  // マイルストーン分析（5, 20, 50, 100件）
  const milestones = [5, 20, 50, 100]
  if (milestones.includes(total) && allItems) {
    try {
      const analysisRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `以下はユーザーが気になって調べたトピック一覧です。必ずJSON形式のみで分析してください。

トピック一覧:
${allItems.map((r) => `- [${r.category}] ${r.question}`).join('\n')}

出力形式（このJSONのみ）:
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "tendency": "あなたの脳内を一言で表すと〇〇型です",
  "message": "ユーザーへの一言コメント（ポジティブに、100字以内）"
}`,
        }],
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

  // ── Step 4: ギモンのつながり検出（3件以上のとき） ──
  let connection: { relatedQuestion: string; reason: string } | null = null
  const pastItems = allItems?.filter((r) => r.question !== question).slice(0, 15)

  if (pastItems && pastItems.length >= 2) {
    try {
      const connectionRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `新しいギモン:「${question}」

過去のギモン一覧:
${pastItems.map((r, i) => `${i + 1}. ${r.question}`).join('\n')}

この新しいギモンと強く関連する過去のギモンが1つだけあれば、JSON形式で返してください。
関連が薄い場合は { "related": null } と返してください。

出力形式:
{ "related": "関連する過去のギモン（原文そのまま）", "reason": "なぜつながるか一言（20字以内）" }`,
        }],
      })
      const raw = connectionRes.content[0].type === 'text' ? connectionRes.content[0].text : ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.related) {
          connection = { relatedQuestion: parsed.related, reason: parsed.reason }
        }
      }
    } catch (e) {
      console.error('Claude connection error:', e)
    }
  }

  return NextResponse.json({ item: newItem, analysis, total, curiosityType, connection })
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const curiosityType = latestAnalysis?.[0]?.result?.tendency ?? null

  return NextResponse.json({
    items: items ?? [],
    total: total ?? 0,
    todayCount: todayCount ?? 0,
    curiosityType,
  })
}
