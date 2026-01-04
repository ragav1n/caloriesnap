'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodItem } from '@/types';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeImage(base64Image: string): Promise<FoodItem | null> {
    if (!apiKey) {
        console.warn('Gemini API Key is missing');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt =
            'Identify the food in this image and estimate the calories. Return ONLY a JSON object: { "food_name": string, "calories": number, "protein": number, "carbs": number, "fats": number, "confidence": string }. Do not include markdown formatting or backticks.';

        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const imagePart = {
            inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: 'image/jpeg',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        return JSON.parse(jsonMatch[0]) as FoodItem;
    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        return null;
    }
}
