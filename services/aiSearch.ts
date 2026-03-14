'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FoodItem } from '@/types';

const USDA_API_KEY = process.env.USDA_API_KEY || ''; // Free at fdc.nal.usda.gov/api-guide
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Step 1: Use Gemini ONLY to parse the natural language into structured food items
// This is a tiny, cheap call — just parsing, no nutrition estimation
const parserModel = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name:     { type: SchemaType.STRING, description: "Canonical food name in English" },
                    quantity: { type: SchemaType.NUMBER, description: "Numeric quantity" },
                    unit:     { type: SchemaType.STRING, description: "Unit: piece, cup, g, ml, tbsp, plate, bowl" },
                },
                required: ["name", "quantity", "unit"],
            },
        },
        temperature: 0,
        maxOutputTokens: 1024, // Increased tokens to prevent JSON truncation
    },
    systemInstruction: `Parse meal descriptions into individual food components. 
Translate regional names to English: "idli" → "idli (steamed rice cake)", "dal" → "lentil soup".
Never estimate nutrition — only extract food name, quantity, and unit.`
});

// Step 2: Look up each parsed item in USDA (verified data, free, unlimited)
async function lookupUSDA(foodName: string): Promise<FoodItem | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const searchRes = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${USDA_API_KEY}`,
            { signal: controller.signal }
        );
        const data = await searchRes.json();
        const food = data.foods?.[0];
        if (!food) return null;

        const getNutrient = (id: number) =>
            food.foodNutrients?.find((n: any) => n.nutrientId === id)?.value ?? 0;

        return {
            food_name: food.description,
            calories: getNutrient(1008),  // Energy
            protein:  getNutrient(1003),  // Protein
            carbs:    getNutrient(1005),  // Carbohydrates
            fats:     getNutrient(1004),  // Total fat
        };
    } catch (error) {
        console.warn('USDA lookup failed:', { foodName, error: error instanceof Error ? error.message : 'Unknown' });
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// Step 3: If USDA has no data (common for Indian dishes), fall back to Gemini estimation
const estimatorModel = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
                food_name: { type: SchemaType.STRING, nullable: false },
                calories:  { type: SchemaType.NUMBER, nullable: false },
                protein:   { type: SchemaType.NUMBER, nullable: false },
                carbs:     { type: SchemaType.NUMBER, nullable: false },
                fats:      { type: SchemaType.NUMBER, nullable: false },
            },
            required: ["food_name", "calories", "protein", "carbs", "fats"],
        },
        temperature: 0.1,
        maxOutputTokens: 512,
    },
    systemInstruction: `You are a clinical nutritionist. Estimate macros for a single food item at the given quantity. 
Account for cooking fats in Indian dishes. Never return zeros.`
});

async function estimateWithGemini(name: string, quantity: number, unit: string): Promise<FoodItem | null> {
    try {
        const result = await estimatorModel.generateContent(
            `Estimate macros for: ${quantity} ${unit} of ${name}`
        );
        const text = result.response.text();
        const cleanJson = text.replace(/```json|```/g, "").trim();
        try {
            return JSON.parse(cleanJson);
        } catch {
            console.warn('Failed to parse Gemini estimator response:', cleanJson);
            return null;
        }
    } catch {
        return null;
    }
}

export async function searchFoodAI(query: string): Promise<FoodItem[]> {
    if (!query.trim()) return [];

    try {
        // Step 1: Parse natural language → structured items (fast, cheap)
        const parseResult = await parserModel.generateContent(
            `Parse this meal: "${query}"`
        );
        const text = parseResult.response.text();
        const cleanJson = text.replace(/```json|```/g, "").trim();

        let parsed: Array<{ name: string; quantity: number; unit: string }>;
        try {
            parsed = JSON.parse(cleanJson);
        } catch {
            console.warn('Failed to parse Gemini parser response:', cleanJson);
            return [];
        }

        // Weight-based units where USDA per-100g values can be accurately scaled
        const weightUnits = new Set(['g', 'kg', 'oz', 'lb', 'gram', 'grams', 'kilogram', 'ounce', 'pound']);

        // Step 2 & 3: Look up each item in USDA (only for weight-based quantities), fall back to Gemini
        // Use allSettled so one failure doesn't drop all results
        const settled = await Promise.allSettled(
            parsed.map(async (item) => {
                // Only use USDA when unit is weight-based — otherwise values are per 100g and can't be
                // reliably scaled to pieces/cups/bowls, so we go straight to Gemini
                if (weightUnits.has(item.unit.toLowerCase())) {
                    const usda = await lookupUSDA(item.name);
                    if (usda) {
                        // Scale from per-100g to actual quantity in grams
                        const quantityInGrams = item.unit.toLowerCase().startsWith('k')
                            ? item.quantity * 1000  // kg → g
                            : item.unit.toLowerCase() === 'oz' || item.unit.toLowerCase() === 'ounce'
                            ? item.quantity * 28.35
                            : item.unit.toLowerCase() === 'lb' || item.unit.toLowerCase() === 'pound'
                            ? item.quantity * 453.59
                            : item.quantity; // already in grams
                        const scale = quantityInGrams / 100;
                        return {
                            food_name: usda.food_name,
                            calories: Math.round(usda.calories * scale),
                            protein:  Math.round(usda.protein * scale * 10) / 10,
                            carbs:    Math.round(usda.carbs * scale * 10) / 10,
                            fats:     Math.round(usda.fats * scale * 10) / 10,
                        } as typeof usda;
                    }
                }
                // For count/volume units (piece, cup, bowl, tbsp, plate) — Gemini accounts for portion
                return estimateWithGemini(item.name, item.quantity, item.unit); // 🔄 Gemini estimation
            })
        );

        const results = settled
            .filter((r): r is PromiseFulfilledResult<FoodItem | null> => r.status === 'fulfilled')
            .map(r => r.value)
            .filter(Boolean) as FoodItem[];

        return results;

    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}
