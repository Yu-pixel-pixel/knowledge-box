interface CounterProps {
  todayCount: number
  total: number
  streak: number
}

export default function Counter({ todayCount, total, streak }: CounterProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-500">
      {streak >= 2 && (
        <span className="flex items-center gap-1">
          <span className="text-orange-400">🔥</span>
          <strong className="text-orange-400 text-base">{streak}</strong>
          <span className="text-xs text-orange-300">日連続</span>
        </span>
      )}
      <span>
        今日 <strong className="text-[#4ECDC4] text-base">{todayCount}</strong> 個
      </span>
      <span className="text-gray-300">|</span>
      <span>
        合計 <strong className="text-gray-700 text-base">{total}</strong> 個
      </span>
    </div>
  )
}
