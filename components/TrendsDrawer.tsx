'use client'

import React from 'react'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay
} from '@/components/ui/drawer'
import { TrendingUp, X, Calendar, BarChart3, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { GlowingTrendChart } from '@/components/TrendCharts'
import { cn } from '@/lib/utils'
import { format, subDays, startOfDay, parseISO, isSameDay } from 'date-fns'

export function TrendsDrawer() {
  const { logs } = useStore()
  const [open, setOpen] = React.useState(false)
  const [viewType, setViewType] = React.useState<'week' | 'month'>('week')

  // Aggregate logs for the chart
  const trendData = React.useMemo(() => {
    // We only need the last 30 days of data at most
    const last30Days = []
    for (let i = 0; i < 30; i++) {
        const d = subDays(new Date(), i)
        const dateStr = format(d, 'yyyy-MM-dd')
        
        const dayCalories = logs
            .filter(log => {
                const logDate = new Date(log.created_at)
                return isSameDay(logDate, d)
            })
            .reduce((sum, log) => sum + log.calories, 0)
        
        last30Days.push({
            date: dateStr,
            calories: dayCalories
        })
    }
    return last30Days.reverse()
  }, [logs])

  const stats = React.useMemo(() => {
    const days = viewType === 'week' ? 7 : 30
    const relevantData = trendData.slice(-days)
    const total = relevantData.reduce((sum, d) => sum + d.calories, 0)
    const activeDays = relevantData.filter(d => d.calories > 0).length
    const avg = activeDays > 0 ? Math.round(total / activeDays) : 0
    const max = relevantData.length > 0 ? Math.max(...relevantData.map(d => d.calories)) : 0

    return { total, avg, max, activeDays }
  }, [trendData, viewType])

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-muted shadow-sm hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground transition-all duration-300">
          <TrendingUp className="h-5 w-5" />
          <span className="sr-only">Trends</span>
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="max-h-[96%] outline-none overflow-hidden">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-4 mt-2" />
          <div className="bg-slate-950 border-t border-white/10 rounded-t-[32px] p-6 text-slate-50 flex-1 overflow-y-auto">
            <DrawerHeader className="flex justify-between items-center mb-4 px-0">
              <div>
                <DrawerTitle className="text-2xl font-bold flex items-center gap-2 text-slate-50">
                  <BarChart3 className="h-6 w-6 text-emerald-500" />
                  Your Trends
                </DrawerTitle>
                <DrawerDescription className="text-slate-400 text-sm">
                  Visualize your calorie intake history
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-50">
                  <X className="h-5 w-5" />
                </button>
              </DrawerClose>
            </DrawerHeader>

            {/* Toggle View */}
            <div className="flex p-1 bg-white/5 rounded-2xl mb-8 w-fit">
              <button
                onClick={() => setViewType('week')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-medium transition-all",
                  viewType === 'week' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewType('month')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-medium transition-all",
                  viewType === 'month' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Monthly
              </button>
            </div>

            {/* Chart Container */}
            <div className="bg-white/5 border border-white/5 rounded-[24px] p-6 mb-8">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Daily Calorie Intake</span>
              </div>
              <GlowingTrendChart data={trendData} type={viewType} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/5 rounded-[24px] p-5">
                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold block mb-2">Average</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">{stats.avg}</span>
                  <span className="text-slate-500 text-xs">cal/day</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-[24px] p-5">
                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold block mb-2">Peak Day</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">{stats.max}</span>
                  <span className="text-slate-500 text-xs">cal</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[24px] p-6">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-emerald-400 mb-1">{viewType === 'week' ? 'Weekly' : 'Monthly'} Summary</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            You've consumed a total of <span className="text-white font-medium">{stats.total} calories</span> across <span className="text-white font-medium">{stats.activeDays} logged day{stats.activeDays !== 1 ? 's' : ''}</span> in the last {viewType === 'week' ? '7' : '30'} days.
                            Consistency is key to reaching your goals!
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}
