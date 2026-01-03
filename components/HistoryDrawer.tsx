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

    const profile = useStore((state) => state.profile);
    const removeLog = useStore((state) => state.removeLog); // We might want to remove from history too

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

    // Initial fetch
    React.useEffect(() => {
        fetchMonthSummary(new Date());
    }, []);

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) return;
        setDate(day);
        fetchDayDetails(day);
    };

    // Modifiers for the calendar
    const modifiers = {
        overBudget: (date: Date) => {
            const key = format(date, 'yyyy-MM-dd');
            const total = summaries[key];
            return total > (profile?.daily_calorie_goal || 2000);
        },
        underBudget: (date: Date) => {
            const key = format(date, 'yyyy-MM-dd');
            const total = summaries[key];
            return total !== undefined && total <= (profile?.daily_calorie_goal || 2000);
        }
    };

    const modifiersStyles = {
        overBudget: { color: 'var(--destructive)', fontWeight: 'bold' },
        underBudget: { color: 'var(--primary)', fontWeight: 'bold' }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
                    <CalendarDays className="h-6 w-6" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>
                        {view === 'calendar' ? 'History' : format(date!, 'MMMM d, yyyy')}
                    </DrawerTitle>
                    <DrawerDescription>
                        {view === 'calendar'
                            ? 'Your calorie journey at a glance.'
                            : 'Detailed breakdown of your meals.'}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="p-4 flex flex-col items-center flex-1 overflow-hidden">
                    {view === 'calendar' ? (
                        <div className="flex flex-col items-center w-full">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateSelect}
                                onMonthChange={handleMonthChange}
                                className="rounded-md border bg-card text-card-foreground shadow-sm"
                                modifiers={modifiers}
                                modifiersClassNames={{
                                    overBudget: "text-red-500 font-bold relative after:content-['•'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:text-red-500 after:text-xs",
                                    underBudget: "text-green-500 font-bold relative after:content-['•'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:text-green-500 after:text-xs"
                                }}
                            />
                            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span>Goal Met</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>Over Budget</span>
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
