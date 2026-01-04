'use server';

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { FoodItem } from '@/types';

// Initialize Gemini
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Define the schema for structured output (faster & more reliable)
const schema: SchemaType | any = {
    description: "Food analysis results",
    type: SchemaType.OBJECT,
    properties: {
        food_name: { type: SchemaType.STRING, description: "Name of the food item", nullable: false },
        calories: { type: SchemaType.NUMBER, description: "Estimated calories", nullable: false },
        protein: { type: SchemaType.NUMBER, description: "Protein in grams", nullable: false },
        carbs: { type: SchemaType.NUMBER, description: "Carbohydrates in grams", nullable: false },
        fats: { type: SchemaType.NUMBER, description: "Fats in grams", nullable: false },
        confidence: { type: SchemaType.STRING, description: "Confidence level", nullable: false },
    },
    required: ["food_name", "calories", "protein", "carbs", "fats", "confidence"],
};

export async function analyzeImage(formData: FormData): Promise<FoodItem | null> {
    if (!apiKey) {
        console.warn('Gemini API Key is missing');
        return null;
    }

    try {
        const file = formData.get('image') as File;
        if (!file) {
            throw new Error("No image file provided");
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                // Return schema-validated JSON directly
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const prompt = 'Identify the food in this image and estimate nutritional content.';

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return JSON.parse(text) as FoodItem;

    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        return null;
    }
}
