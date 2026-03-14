'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Search, Plus, Loader2, Coffee, Sun, Moon, Apple, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FluidDropdown } from '@/components/ui/fluid-dropdown';
import PillMorphTabs from '@/components/ui/pill-morph-tabs';
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
    const profile = useStore((state) => state.profile);

    // Tab control
    const [activeTab, setActiveTab] = React.useState('search');

    // Search state
    const [query, setQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchError, setSearchError] = React.useState<string | null>(null);

    // AI scan state
    const [analyzing, setAnalyzing] = React.useState(false);
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [aiFilledFood, setAiFilledFood] = React.useState<string | null>(null);

    // Manual form
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FoodItem>();
    const [selectedMeal, setSelectedMeal] = React.useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
    const [submitting, setSubmitting] = React.useState(false);

    // Revoke blob URLs when capturedImage changes to prevent memory leaks
    React.useEffect(() => {
        return () => {
            if (capturedImage?.startsWith('blob:')) {
                URL.revokeObjectURL(capturedImage);
            }
        };
    }, [capturedImage]);

    // Reset all state when drawer closes
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setActiveTab('search');
            setQuery('');
            setSearchResults([]);
            setSearchError(null);
            setCapturedImage(null);
            setAiError(null);
            setAiFilledFood(null);
            reset();
        }
    };

    const onSearch = async () => {
        if (!query.trim() || isSearching) return;
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        try {
            const results = await searchFoodAI(query);
            setSearchResults(results);
            if (results.length === 0) setSearchError('No results found. Try rephrasing your search.');
        } catch (e) {
            console.error('Search failed', e);
            setSearchError('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = Math.min(MAX_WIDTH, img.width);
                    const height = img.height * (img.width > MAX_WIDTH ? scaleSize : 1);
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas to Blob failed'));
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAiError(null);
        setAiFilledFood(null);

        try {
            const previewUrl = URL.createObjectURL(file);
            setCapturedImage(previewUrl);
            setAnalyzing(true);

            const compressedBlob = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedBlob, 'food.jpg');

            // @ts-ignore
            const result = await analyzeImage(formData);

            if (result) {
                if (result.confidence?.toLowerCase() === 'low') {
                    setCapturedImage(null);
                    setAiError('Confidence is too low. Please retake the photo with better lighting or a clearer angle.');
                } else {
                    setValue('food_name', result.food_name);
                    setValue('calories', result.calories);
                    setValue('protein', result.protein || 0);
                    setValue('carbs', result.carbs || 0);
                    setValue('fats', result.fats || 0);
                    setAiFilledFood(result.food_name);
                    // Switch to Manual tab so user can see and edit the filled values
                    setActiveTab('manual');
                }
            } else {
                setCapturedImage(null);
                setAiError('Could not identify food. Please try again or enter manually.');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            setAiError('Error processing image. Please try another one.');
            setCapturedImage(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const onSubmit = async (data: FoodItem) => {
        if (!profile?.id) {
            console.error('No user profile found');
            return;
        }
        setSubmitting(true);
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
        handleOpenChange(false);
    };

    const handleQuickAdd = (item: FoodItem) => {
        onSubmit(item);
    };

    return (
        <Drawer open={isOpen} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
            <DrawerTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90" aria-label="Add food">
                    <Plus className="h-8 w-8 text-primary-foreground" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh] flex flex-col" onInteractOutside={(e) => e.stopPropagation()}>
                <DrawerHeader>
                    <DrawerTitle>Add Food</DrawerTitle>
                    <DrawerDescription>Search, scan, or manually enter your food.</DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 px-4 overflow-y-auto overscroll-contain">
                    {/* Meal Selector */}
                    <div className="mb-6 space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground ml-1">Meal Type</Label>
                        <FluidDropdown
                            value={selectedMeal}
                            onSelect={(item) => setSelectedMeal(item.id as any)}
                            items={[
                                { id: 'breakfast', label: 'Breakfast', icon: Coffee, color: '#f59e0b' },
                                { id: 'lunch', label: 'Lunch', icon: Sun, color: '#fbbf24' },
                                { id: 'dinner', label: 'Dinner', icon: Moon, color: '#6366f1' },
                                { id: 'snack', label: 'Snack', icon: Apple, color: '#ef4444' },
                            ]}
                        />
                    </div>

                    <PillMorphTabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                        items={[
                            {
                                value: 'search',
                                label: 'Search',
                                panel: (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Describe your meal (e.g. 2 idlis with sambar)"
                                                value={query}
                                                onChange={(e) => { setQuery(e.target.value); setSearchError(null); }}
                                                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                                                aria-label="Search food"
                                            />
                                            <Button onClick={onSearch} disabled={isSearching || !query.trim()} aria-label="Search">
                                                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                                            </Button>
                                        </div>
                                        {searchError && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                                                <span>{searchError}</span>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {searchResults.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 border rounded-lg bg-card active:scale-[0.98] transition-transform cursor-pointer"
                                                    onClick={() => handleQuickAdd(item)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{item.food_name}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                                                            <span className="font-semibold text-foreground">{Math.round(item.calories)} kcal</span>
                                                            <span>P: {Number(item.protein.toFixed(1))}g</span>
                                                            <span>C: {Number(item.carbs.toFixed(1))}g</span>
                                                            <span>F: {Number(item.fats.toFixed(1))}g</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="shrink-0 ml-2" aria-label={`Add ${item.food_name}`}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                value: 'scan',
                                label: 'AI Scan',
                                panel: (
                                    <div className="space-y-4 flex flex-col items-center">
                                        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                                            {capturedImage ? (
                                                <img src={capturedImage} alt="Food preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                                                    <Camera className="h-12 w-12" />
                                                    <span className="text-xs">Tap to upload</span>
                                                </div>
                                            )}
                                            {!analyzing && (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={onFileChange}
                                                    aria-label="Upload food image"
                                                />
                                            )}
                                        </div>
                                        {analyzing && (
                                            <div className="flex items-center gap-2 text-primary animate-pulse">
                                                <Loader2 className="animate-spin h-4 w-4" /> Analyzing image...
                                            </div>
                                        )}
                                        {aiError && (
                                            <div className="flex items-center gap-2 text-sm text-destructive w-full">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{aiError}</span>
                                            </div>
                                        )}
                                        {!analyzing && !aiError && !capturedImage && (
                                            <p className="text-sm text-muted-foreground text-center">
                                                Take a photo or upload an image of your meal. AI will identify and estimate the nutrition automatically.
                                            </p>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                value: 'manual',
                                label: 'Manual',
                                panel: (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        {aiFilledFood && (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                <span>AI filled values for <strong>{aiFilledFood}</strong> — review and edit before adding.</span>
                                            </div>
                                        )}
                                        <div className="grid gap-2">
                                            <Label htmlFor="food_name">Food Name</Label>
                                            <Input
                                                id="food_name"
                                                {...register('food_name', { required: 'Food name is required' })}
                                                placeholder="e.g. Banana"
                                                aria-invalid={!!errors.food_name}
                                            />
                                            {errors.food_name && (
                                                <p className="text-xs text-destructive">{errors.food_name.message}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="calories">Calories</Label>
                                                <Input
                                                    id="calories"
                                                    type="number"
                                                    step="any"
                                                    {...register('calories', { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })}
                                                    placeholder="0"
                                                    aria-invalid={!!errors.calories}
                                                />
                                                {errors.calories && (
                                                    <p className="text-xs text-destructive">{errors.calories.message}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="protein">Protein (g)</Label>
                                                <Input id="protein" type="number" step="any" {...register('protein')} placeholder="0" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="carbs">Carbs (g)</Label>
                                                <Input id="carbs" type="number" step="any" {...register('carbs')} placeholder="0" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="fats">Fats (g)</Label>
                                                <Input id="fats" type="number" step="any" {...register('fats')} placeholder="0" />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={submitting}>
                                            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                            Add Log
                                        </Button>
                                    </form>
                                ),
                            },
                        ]}
                    />
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
