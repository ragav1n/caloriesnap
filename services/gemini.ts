'use server';

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { FoodItem } from '@/types';

const apiKey = process.env.GEMINI_API_KEY || ''; // ⚠️ Remove NEXT_PUBLIC_ — never expose API keys client-side
const genAI = new GoogleGenerativeAI(apiKey);

const schema: SchemaType | any = {
    description: "Food analysis results",
    type: SchemaType.OBJECT,
    properties: {
        food_name:   { type: SchemaType.STRING, description: "Specific name with cooking method and key ingredients", nullable: false },
        calories:    { type: SchemaType.NUMBER, description: "Total estimated calories (kcal)", nullable: false },
        protein:     { type: SchemaType.NUMBER, description: "Total protein in grams", nullable: false },
        carbs:       { type: SchemaType.NUMBER, description: "Total carbohydrates in grams", nullable: false },
        fats:        { type: SchemaType.NUMBER, description: "Total fats in grams, including hidden cooking fats", nullable: false },
        confidence:  { type: SchemaType.STRING, enum: ["high", "medium", "low"], description: "Confidence level", nullable: false },
        portion_note: { type: SchemaType.STRING, description: "Brief note on how portion was estimated", nullable: false },
    },
    required: ["food_name", "calories", "protein", "carbs", "fats", "confidence", "portion_note"],
};

export async function analyzeImage(formData: FormData): Promise<FoodItem | null> {
    if (!apiKey) {
        console.warn('Gemini API Key is missing');
        return null;
    }

    try {
        const file = formData.get('image') as File;
        if (!file) throw new Error("No image file provided");

        const arrayBuffer = await file.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview', // ✅ Best vision model as of March 2026
            systemInstruction: `You are a clinical nutritionist and food scientist specializing in accurate portion estimation and macro calculation.

IDENTIFICATION:
- Identify ALL visible food items: mains, sides, sauces, garnishes, drinks, condiments
- For branded/packaged food with a visible label, use the actual label nutrition data
- Be specific: "Paneer butter masala with 1 tandoori roti" not "Indian food"

PORTION ESTIMATION (critical):
- Use ANY size reference: fork (~18cm), spoon, credit card (~8.5cm), hand, plate diameter, bottle
- If no reference: estimate from plate fill %, bowl depth, stacking height, and standard vessel sizes
- State your estimation method in portion_note

FAT ACCOUNTING (most common error):
- Visible oil/ghee: add directly
- Indian curries: assume 2-3 tbsp oil per serving unless clearly low-fat
- Tempering/tadka: add 1 tbsp oil equivalent
- Restaurant food: add 20-30% more fat than home-cooked equivalent
- Fried items: use standard absorption rates (shallow-fry ~15%, deep-fry ~20% of weight)

CALCULATION METHOD:
1. List each component with estimated weight (grams)
2. Look up or recall macros per 100g for each
3. Scale to estimated portion
4. Sum all components
5. Round calories to nearest 5kcal, macros to nearest 0.5g

CONFIDENCE:
- high: clear image + identifiable food + size reference visible
- medium: identifiable food, no size reference OR partially visible
- low: blurry, ambiguous, or <50% of dish visible — still estimate, never return zeros`,

            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.1,      // Low = consistent, reproducible estimates
                topP: 0.8,             // Tighten sampling distribution
                maxOutputTokens: 512,  // Nutrition JSON needs very few tokens
            }
        });

        const prompt = `Analyze this food image:

Step 1 — Inventory: List every food item visible, including sauces and sides.
Step 2 — Reference: Identify any size reference objects. If none, note the plate/bowl type.
Step 3 — Portions: Estimate weight (g) of each component using your reference.
Step 4 — Macros: Calculate calories, protein, carbs, fats for each component.
Step 5 — Sum: Add all components together and return as JSON.

If confidence is low, return your best estimate anyway — never return zero values for a visible meal.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ]);

        return JSON.parse(result.response.text()) as FoodItem;

    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        return null;
    }
}
