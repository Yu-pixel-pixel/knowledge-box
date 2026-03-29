export type Category = '科学' | '歴史' | '技術' | '社会' | '芸術' | 'その他'

export interface KnowledgeItem {
  id: string
  user_id: string
  question: string
  summary: string | null
  tags: string[] | null
  category: Category | null
  created_at: string
}

export interface AnalysisResult {
  keywords: string[]
  tendency: string
  message: string
}

export interface Analysis {
  id: string
  user_id: string
  trigger_count: number
  result: AnalysisResult
  created_at: string
}

export interface User {
  id: string
  email: string | null
  is_premium: boolean
  created_at: string
}
