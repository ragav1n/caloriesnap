'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { format, parseISO } from 'date-fns'

export function GlowingTrendChart({ data, type }: { data: any[], type: 'week' | 'month' }) {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-[200px] w-full bg-slate-900/50 animate-pulse rounded-xl" />

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsPrimitive

  // Map and slice data
  const daysToShow = type === 'week' ? 7 : 30
  const chartData = data.slice(-daysToShow).map(d => ({
    date: format(parseISO(d.date), 'EEE d'),
    calories: d.calories
  }))

  return (
    <div className="h-[250px] w-full flex justify-center">
      <AreaChart width={350} height={250} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
        <defs>
          <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 10 }}
          dy={10}
          interval={type === 'month' ? 4 : 0}
        />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
          itemStyle={{ color: '#10b981' }}
          cursor={{ stroke: '#10b981', strokeWidth: 1 }}
        />
        <Area 
          type="monotone" 
          dataKey="calories" 
          stroke="#10b981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorCalories)" 
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  )
}
