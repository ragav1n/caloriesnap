'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CalorieBudgetRing } from '@/components/CalorieBudgetRing';
import { InputDrawer } from '@/components/InputDrawer';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Coffee, Sun, Moon, Apple, HelpCircle, ChevronRight, ChevronDown, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSync } from '@/components/DataSync';
import { Loader } from '@/components/ui/Loader';
import { deleteUserLog } from '@/actions/data';

import { logout } from '@/app/auth/actions';

export default function Dashboard() {
    const { logs, profile, setProfile } = useStore();
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
    const todayLogs = logs; // In real app, filter by today
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
                                    <div key={log.id} className="flex justify-between items-center text-sm pl-16 py-1 border-t border-border/50 first:border-0">
                                        <span>{log.food_name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground font-medium">{log.calories}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteUserLog(log.id)}
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 pb-4 pl-16 text-sm text-muted-foreground italic">
                                No food logged yet.
                            </div>
                        )}
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        );
    }

    if (!profile) return null; // Or some fallback while profile inits

    return (
        <div className="min-h-screen bg-background pb-24 text-foreground relative">
            {/* Loader Overlay */}
            {mounted && (
                <Loader className={loading ? 'opacity-100' : 'opacity-0 pointer-events-none'} />
            )}

            <DataSync />

            {/* Top Header */}
            <header className="px-6 pt-14 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="/caloriesnap_logo.png" alt="CalorieSnap" className="h-10 w-10 object-contain" />
                    <h1 className="text-3xl font-bold">Today</h1>
                </div>
                <div className="flex items-center gap-2">
                    <HistoryDrawer />
                    <SettingsDialog />
                    <form action={logout}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <span className="sr-only">Logout</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" x2="9" y1="12" y2="12" />
                            </svg>
                        </Button>
                    </form>
                </div>
            </header>

            <main className="px-4 space-y-6">
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

            {/* Floating Action Button for Global Add */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto shadow-2xl rounded-full">
                    <InputDrawer />
                </div>
            </div>
        </div>
    );
}
