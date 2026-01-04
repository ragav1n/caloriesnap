'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Log } from '@/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailySummary {
    date_log: string;
    total_calories: number;
    log_count: number;
}

export function HistoryDrawer() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [summaries, setSummaries] = React.useState<Record<string, number>>({});
    const [selectedDayLogs, setSelectedDayLogs] = React.useState<Log[]>([]);
    const [view, setView] = React.useState<'calendar' | 'details'>('calendar');
    const [loading, setLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const profile = useStore((state) => state.profile);

    // Fetch monthly summary
    const fetchMonthSummary = async (month: Date) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();

        const { data, error } = await supabase.rpc('get_monthly_calorie_summary', {
            start_date: start,
            end_date: end,
        });

        if (error) {
            console.error('Error fetching history:', JSON.stringify(error, null, 2));
            console.error('Params:', { start, end });
            return;
        }

        if (data) {
            const map: Record<string, number> = {};
            data.forEach((d: any) => {
                map[d.date_log] = d.total_calories;
            });
            setSummaries(map);
        }
    };

    // Fetch details for a specific day
    const fetchDayDetails = async (day: Date) => {
        setLoading(true);
        // Set range for the whole day
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true });

        if (data) {
            setSelectedDayLogs(data);
            setView('details');
        }
        setLoading(false);
    };

    const handleMonthChange = (month: Date) => {
        fetchMonthSummary(month);
    };

    // Fetch monthly summary on open
    React.useEffect(() => {
        if (isOpen) {
            fetchMonthSummary(date || new Date());
        }
    }, [isOpen]);

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) return;
        setDate(day);
        fetchDayDetails(day);
    };

    // Modifiers for the calendar
    const modifiers = {
        overBudget: (date: Date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const todayKey = format(new Date(), 'yyyy-MM-dd');
            if (dateKey > todayKey) return false;

            const total = summaries[dateKey];
            return total > (profile?.daily_calorie_goal || 2000);
        },
        underBudget: (date: Date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const todayKey = format(new Date(), 'yyyy-MM-dd');
            if (dateKey > todayKey) return false;

            const total = summaries[dateKey];
            return total !== undefined && total <= (profile?.daily_calorie_goal || 2000);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-muted shadow-sm hover:bg-background">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh]">
                <DrawerHeader className="text-left px-6 pt-6">
                    <DrawerTitle className="text-2xl font-bold">
                        {view === 'calendar' ? 'History' : format(date!, 'MMMM d')}
                    </DrawerTitle>
                    <DrawerDescription>
                        {view === 'calendar'
                            ? 'Your daily progress overview.'
                            : 'Detailed log for this day.'}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-6 flex flex-col items-center flex-1 overflow-y-auto w-full max-w-md mx-auto pb-10">
                    {view === 'calendar' ? (
                        <div className="flex flex-col items-center w-full shrink-0 gap-6 pb-24">
                            {/* Calendar Card */}
                            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-2xl shadow-xl w-full">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={handleDateSelect}
                                    onMonthChange={handleMonthChange}
                                    className="w-full flex justify-center"
                                    modifiers={modifiers}
                                    modifiersClassNames={{
                                        overBudget: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-destructive",
                                        underBudget: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500"
                                    }}
                                    classNames={{
                                        month: "space-y-4 w-full",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex w-full justify-between",
                                        row: "flex w-full mt-2 justify-between",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-800 rounded-full transition-colors",
                                    }}
                                />
                            </div>

                            {/* Legend (Pills) */}
                            <div className="flex flex-wrap justify-center gap-3 w-full mt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full shadow-sm">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-gray-300">Goal Met</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full shadow-sm">
                                    <div className="w-3 h-3 bg-destructive rounded-full" />
                                    <span className="text-xs font-medium text-gray-300">Over Limit</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex-1 flex flex-col">
                            <Button
                                variant="ghost"
                                className="self-start mb-2 pl-0 gap-1"
                                onClick={() => setView('calendar')}
                            >
                                <ChevronLeft className="h-4 w-4" /> Back to Month
                            </Button>

                            <ScrollArea className="flex-1 w-full pr-4">
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                                ) : selectedDayLogs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No logs for this day.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDayLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                                <div>
                                                    <div className="font-medium text-sm">{log.food_name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{log.meal_type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-sm">{log.calories} kcal</div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t mt-4">
                                            <div className="flex justify-between font-bold">
                                                <span>Total</span>
                                                <span>{selectedDayLogs.reduce((acc, l) => acc + l.calories, 0)} kcal</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
