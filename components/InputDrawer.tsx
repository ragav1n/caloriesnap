'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose
} from '@/components/ui/drawer';
import { searchFoodAI } from '@/services/aiSearch';
import { analyzeImage } from '@/services/gemini';
import { FoodItem } from '@/types';
import { useStore } from '@/store/useStore';
import { v4 as uuidv4 } from 'uuid';

export function InputDrawer() {
    const [isOpen, setIsOpen] = React.useState(false);
    const addLog = useStore((state) => state.addLog);
    const profile = useStore((state) => state.profile);

    // Search State
    const [query, setQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);

    // AI State
    const [analyzing, setAnalyzing] = React.useState(false);
    const [capturedImage, setCapturedImage] = React.useState<string | null>(
        null
    );

    // Manual Form
    const { register, handleSubmit, reset, setValue } = useForm<FoodItem>();
    const [selectedMeal, setSelectedMeal] = React.useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
    const [submitting, setSubmitting] = React.useState(false);

    const onSearch = async () => {
        if (!query) return;
        setIsSearching(true);
        try {
            const results = await searchFoodAI(query);
            setSearchResults(results);
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setCapturedImage(base64);
                setAnalyzing(true);
                const result = await analyzeImage(base64);
                if (result) {
                    setValue('food_name', result.food_name);
                    setValue('calories', result.calories);
                    setValue('protein', result.protein || 0);
                    setValue('carbs', result.carbs || 0);
                    setValue('fats', result.fats || 0);
                } else {
                    // Reset if analysis failed
                    setCapturedImage(null);
                    alert("Could not identify food. Please try again or enter manually.");
                }
                setAnalyzing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: FoodItem) => {
        if (!profile?.id) {
            // Ideally should redirect to login, but for now just console error
            console.error("No user profile found");
            return;
        }
        setSubmitting(true);

        // Import dynamically or use the imported action
        const { addUserLog } = await import('@/actions/data');

        await addUserLog({
            id: uuidv4(),
            user_id: profile.id,
            food_name: data.food_name,
            calories: Number(data.calories),
            protein: Number(data.protein || 0),
            carbs: Number(data.carbs || 0),
            fats: Number(data.fats || 0),
            meal_type: selectedMeal,
            created_at: new Date().toISOString(),
        });

        setSubmitting(false);
        setIsOpen(false);
        reset();
        setCapturedImage(null);
        setSearchResults([]);
        setQuery('');
    };

    const handleQuickAdd = (item: FoodItem) => {
        onSubmit(item);
    }

    const [activeTab, setActiveTab] = React.useState('search');

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90">
                    <Plus className="h-8 w-8 text-primary-foreground" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh] flex flex-col">
                <DrawerHeader>
                    <DrawerTitle>Add Food</DrawerTitle>
                    <DrawerDescription>
                        Search, scan, or manually enter your food.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 px-4 overflow-y-auto">
                    {/* Meal Selector - Global for all inputs */}
                    <div className="mb-6 space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground ml-1">Meal Type</Label>
                        <div className="flex gap-2">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                                <Button
                                    key={m}
                                    type="button"
                                    variant={selectedMeal === m ? 'default' : 'outline'}
                                    className="flex-1 capitalize text-xs h-9"
                                    onClick={() => setSelectedMeal(m)}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="search">Search</TabsTrigger>
                            <TabsTrigger value="scan">AI Scan</TabsTrigger>
                            <TabsTrigger value="manual">Manual</TabsTrigger>
                        </TabsList>

                        {/* Search Content */}
                        <TabsContent value="search" className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Describe your meal (e.g. 2 idlis with sambar)"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                                />
                                <Button onClick={onSearch} disabled={isSearching}>
                                    {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {searchResults.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-card active:scale-[0.98] transition-transform cursor-pointer"
                                        onClick={() => handleQuickAdd(item)}
                                    >
                                        <div>
                                            <div className="font-medium">{item.food_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {item.calories} kcal
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Scan Content */}
                        <TabsContent value="scan" className="space-y-4 flex flex-col items-center">
                            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                                {capturedImage ? (
                                    <img
                                        src={capturedImage}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="h-12 w-12 text-muted-foreground/50" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={onFileChange}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Tap the box to take a photo or upload.
                            </p>
                            {analyzing && (
                                <div className="flex items-center gap-2 text-primary animate-pulse">
                                    <Loader2 className="animate-spin" /> Analyzing with Gemini...
                                </div>
                            )}

                            {/* If AI pre-fills the form, we can show the manual tab or just show the result here to confirm */}
                            {capturedImage && !analyzing && (
                                <div className="w-full pt-4">
                                    <Button onClick={() => setActiveTab('manual')} className="w-full">
                                        Review & Add
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        {/* Manual Content */}
                        <TabsContent value="manual">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="food_name">Food Name</Label>
                                    <Input id="food_name" {...register('food_name', { required: true })} placeholder="e.g. Banana" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="calories">Calories</Label>
                                        <Input id="calories" type="number" {...register('calories', { required: true })} placeholder="0" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="protein">Protein (g)</Label>
                                        <Input id="protein" type="number" {...register('protein')} placeholder="0" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="carbs">Carbs (g)</Label>
                                        <Input id="carbs" type="number" {...register('carbs')} placeholder="0" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fats">Fats (g)</Label>
                                        <Input id="fats" type="number" {...register('fats')} placeholder="0" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">
                                    Add Log
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
