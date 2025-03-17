import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function getQuizzes(category: string, limit: number, difficulty?: "easy" | "medium" | "hard") {
    if (!category || limit <= 0) {
        throw new Error("Invalid parameters: Category and limit must be provided.");
    }

    const formattedQuery = `Generate ${limit || 10} ${difficulty || "easy"} quizzes about ${category}, each containing:
    - A question.
    - A list of options.
    - The correct answer.
    - A timer in seconds based on the question difficulty.`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY as string);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            question: {
                                type: SchemaType.STRING,
                                description: "The quiz question",
                            },
                            options: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.STRING,
                                },
                                description: "A list of possible answers",
                            },
                            correctAnswer: {
                                type: SchemaType.STRING,
                                description: "The correct answer to the quiz question",
                            },
                            timer: {
                                type: SchemaType.NUMBER,
                                description: "Time in seconds to answer the question",
                            },
                        },
                        required: ["question", "options", "correctAnswer", "timer"],
                    },
                },
            },
        });

        const result = await model.generateContent(formattedQuery);
        const response = result.response.text();
        return JSON.parse(response);
    } catch (error: any) {
        console.error("Error in getQuizzes function:", error);

        // Handle specific API errors
        if (error.message.includes("API_KEY")) {
            throw new Error("Invalid or expired API key. Please check your .env file.");
        } else if (error.message.includes("quota")) {
            throw new Error("API quota exceeded. Please check your usage limits.");
        } else if (error.message.includes("network")) {
            throw new Error("Network error. Please check your internet connection.");
        } else if (error.message.includes("model")) {
            throw new Error("Invalid model specified. Please check the model name.");
        } else if (error.message.includes("schema")) {
            throw new Error("Invalid schema. Please check the schema definition.");
        } else {
            throw new Error("An unexpected error occurred. Please try again later.");
        }
    }
}

export { getQuizzes };