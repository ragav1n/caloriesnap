'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Plus, Coffee, Sun, Moon, Apple, HelpCircle, ChevronRight, ChevronDown, Settings, LogOut, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUserLog } from '@/actions/data';

// Dynamic Imports for Heavy Components
const CalorieBudgetRing = dynamic(() => import('@/components/CalorieBudgetRing').then(mod => mod.CalorieBudgetRing), { ssr: false });
const InputDrawer = dynamic(() => import('@/components/InputDrawer').then(mod => mod.InputDrawer), { ssr: false });
const HistoryDrawer = dynamic(() => import('@/components/HistoryDrawer').then(mod => mod.HistoryDrawer), { ssr: false });
const SettingsDialog = dynamic(() => import('@/components/SettingsDialog').then(mod => ({ default: mod.SettingsDialog })), { ssr: false });
const TrendsDrawer = dynamic(() => import('@/components/TrendsDrawer').then(mod => mod.TrendsDrawer), { ssr: false });
const DataSync = dynamic(() => import('@/components/DataSync').then(mod => ({ default: mod.DataSync })), { ssr: false });
const Loader = dynamic(() => import('@/components/ui/Loader').then(mod => mod.Loader), { ssr: false });

import { logout } from '@/app/auth/actions';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { WeekDatePicker } from '@/components/ui/week-date-picker';
import { format } from 'date-fns';

export default function Dashboard() {
    const { logs, profile, setProfile } = useStore();
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [loading, setLoading] = React.useState(true);
    const [mounted, setMounted] = React.useState(true);

    // Initial Loading Simulation with Fade Out
    useEffect(() => {
        // Simulate async check or data fetching
        const timer = setTimeout(() => {
            setLoading(false); // Start fade out

            // Remove from DOM after transition completes (700ms matches Loader duration)
            setTimeout(() => {
                setMounted(false);
            }, 700);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Mock profile setup if empty
    useEffect(() => {
        if (!profile) {
            setProfile({
                id: 'user-1',
                email: 'user@example.com',
                full_name: 'User',
                daily_calorie_goal: 2000,
                protein_goal: 150,
                carbs_goal: 250,
                fats_goal: 70,
                breakfast_goal: 500,
                lunch_goal: 700,
                dinner_goal: 600,
                snack_goal: 200,
            });
        }
    }, [profile, setProfile]);

    // Aggregation Logic
    const todayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at).toDateString();
        const currentDate = selectedDate.toDateString();
        return logDate === currentDate;
    });
    const consumed = todayLogs.reduce((acc, l) => acc + l.calories, 0);

    const macros = todayLogs.reduce((acc, l) => ({
        p: acc.p + l.protein,
        c: acc.c + l.carbs,
        f: acc.f + l.fats
    }), { p: 0, c: 0, f: 0 });

    const getMealLogs = (type: string) => todayLogs.filter(l => l.meal_type === type);
    const getMealCals = (type: string) => getMealLogs(type).reduce((acc, l) => acc + l.calories, 0);

    const MealSection = ({ title, type, icon: Icon, goal = 600 }: { title: string, type: 'breakfast' | 'lunch' | 'dinner' | 'snack', icon: any, goal?: number }) => {
        const mealLogs = getMealLogs(type);
        const cals = mealLogs.reduce((acc, l) => acc + l.calories, 0);
        const [isOpen, setIsOpen] = React.useState(false);

        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card className="mb-4 border-none shadow-sm bg-card/50">
                    <CollapsibleTrigger asChild>
                        <CardContent className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{title}</h3>
                                    <p className="text-sm text-muted-foreground">{cals} / {goal} Cal</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-muted-foreground">
                                {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                            </Button>
                        </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        {mealLogs.length > 0 ? (
                            <div className="px-4 pb-4 space-y-2">
                                {mealLogs.map(log => (
                                    <div key={log.id} className="flex justify-between items-center text-sm pl-16 py-1 border-t border-border/50 first:border-0 group">
                                        <span>{log.food_name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground font-medium">{log.calories}</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl p-1 min-w-[120px]">
                                                    <DropdownMenuItem 
                                                        className="text-red-500 font-semibold focus:text-red-400 focus:bg-destructive/10 rounded-lg cursor-pointer"
                                                        onClick={() => deleteUserLog(log.id)}
                                                    >
                                                        Delete Log
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 pb-6 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                                    <Icon className="h-5 w-5 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm text-muted-foreground font-medium italic">
                                    No {title.toLowerCase()} logged yet
                                </p>
                            </div>
                        )}
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        );
    }

    if (!profile) return null; // Or some fallback while profile inits

    return (
        <div className="relative min-h-screen">
            <AuroraBackground className="fixed inset-0 z-0" />
            
            <div vaul-drawer-wrapper="" className="relative z-10 flex flex-col min-h-screen bg-transparent">
                <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-3">
                        <Image src="/caloriesnap_logo.png" alt="CalorieSnap" width={40} height={40} className="object-cover rounded-full w-10 h-10" />
                        <div>
                            <h1 className="text-3xl font-bold leading-tight">
                                {selectedDate.toDateString() === new Date().toDateString() ? "Today" : format(selectedDate, 'MMM d')}
                            </h1>
                            {profile?.full_name && (
                                <p className="text-sm text-muted-foreground font-medium">
                                    Welcome back, {profile.full_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Interactive triggers will be here, but the Portal is at root */}
                        <TrendsDrawer />
                        <HistoryDrawer />
                        <SettingsDialog />
                        <form action={logout}>
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-muted shadow-sm hover:bg-destructive/10 hover:text-destructive text-muted-foreground group transition-all duration-300">
                                <span className="sr-only">Logout</span>
                                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            </Button>
                        </form>
                    </div>
                </header>

                <main className="px-4 space-y-6 flex-1 bg-transparent">
                    <WeekDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

                    {/* Summary Card */}
                    <Card className="border-none shadow-md bg-card">
                        <CardContent className="pt-6 pb-8">
                            <CalorieBudgetRing
                                consumed={consumed}
                                goal={profile?.daily_calorie_goal || 2000}
                            />

                            {/* Macro Split */}
                            <div className="mt-8 grid grid-cols-3 gap-4 px-2">
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Carbs</span>
                                        <span>{macros.c}/{profile?.carbs_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.c / (profile?.carbs_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-blue-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{macros.c}g</p>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Protein</span>
                                        <span>{macros.p}/{profile?.protein_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.p / (profile?.protein_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-green-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{macros.p}g</p>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Fat</span>
                                        <span>{macros.f}/{profile?.fats_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.f / (profile?.fats_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-yellow-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{macros.f}g</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meal List */}
                    <div className="space-y-2">
                        <MealSection title="Breakfast" type="breakfast" icon={Coffee} goal={profile?.breakfast_goal} />
                        <MealSection title="Lunch" type="lunch" icon={Sun} goal={profile?.lunch_goal} />
                        <MealSection title="Dinner" type="dinner" icon={Moon} goal={profile?.dinner_goal} />
                        <MealSection title="Snacks" type="snack" icon={Apple} goal={profile?.snack_goal} />
                    </div>
                </main>
            </div>

            {/* Floating Action Button for Global Add */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto shadow-2xl rounded-full">
                    <InputDrawer />
                </div>
            </div>

            {/* Loader Overlay - Keep at root for visibility */}
            {mounted && (
                <Loader className={loading ? 'opacity-100 transition-opacity duration-500' : 'opacity-0 pointer-events-none transition-opacity duration-500'} />
            )}
            
            <DataSync />
        </div>
    );
}
