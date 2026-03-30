'use client'

import { useState } from 'react'

interface KnowledgeInputProps {
  onSubmit: (question: string) => Promise<void>
  isLoading: boolean
  isLoggedIn: boolean
  onLoginRequest: () => void
}

const EXAMPLES = [
  'なぜ夢って覚えてないんだろう',
  'お金ってそもそも何でできてるの？',
  'なぜ人は音楽で感動するんだろう',
  'AIって本当に考えてるの？',
  'なぜ空は青いの？',
]

export default function KnowledgeInput({ onSubmit, isLoading, isLoggedIn, onLoginRequest }: KnowledgeInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || isLoading) return

    if (!isLoggedIn) {
      onLoginRequest()
      return
    }

    await onSubmit(value.trim())
    setValue('')
  }

  const randomExample = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={`例：${randomExample}`}
          rows={3}
          disabled={isLoading}
          className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-800 placeholder-gray-300 shadow-sm focus:border-[#4ECDC4] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/20 disabled:opacity-60 transition-all text-base"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-4 py-2 bg-[#4ECDC4] text-white rounded-xl text-sm font-medium hover:bg-[#3db8b0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ちょっと待って...
            </>
          ) : (
            '記録する'
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400 text-right">Enter で送信 / Shift+Enter で改行</p>
    </form>
  )
}
