interface CounterProps {
  todayCount: number
  total: number
}

export default function Counter({ todayCount, total }: CounterProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-500">
      <span>
        今日 <strong className="text-[#4ECDC4] text-base">{todayCount}</strong> 件
      </span>
      <span className="text-gray-300">|</span>
      <span>
        合計 <strong className="text-gray-700 text-base">{total}</strong> 件
      </span>
    </div>
  )
}
