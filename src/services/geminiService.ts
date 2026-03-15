import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following intelligence input for an Advanced E-Consultation platform. 
    This system uses a 4-class sentiment classification: Positive, Negative, Neutral, and Sarcastic.
    
    Provide a detailed analysis including:
    1. Sentiment: One of ["positive", "negative", "neutral", "sarcastic"].
    2. Intensity: Sentiment intensity score (0-1).
    3. Toxicity: Toxicity/Anomaly detection score (0-1).
    4. Sarcasm Detection: Boolean flag.
    5. Urgency: Boolean flag for critical feedback patterns.
    6. Spam/Bot Detection: Boolean flag 'is_spam' and 'spam_score' (0-1).
    7. Polarization: Score (0-1) indicating how emotionally polarized or extreme the opinion is.
    8. Topic: A short, concise topic label.
    9. Explanation: A brief, transparent explanation of the classification (Explainable AI/XAI).
    10. Actionable Insight: A one-sentence recommendation for policy makers based on this comment.
    11. Language: Detect the source language.
    12. Translation: If the language is not English, provide a translation in 'translated_text'.
    13. Entities: Extract key entities (people, places, organizations) mentioned.
    14. Confidence: Provide a confidence score (0-1) for your analysis.
    
    Text Input: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral", "sarcastic"] },
          intensity: { type: Type.NUMBER },
          toxicity: { type: Type.NUMBER },
          is_sarcastic: { type: Type.BOOLEAN },
          is_urgent: { type: Type.BOOLEAN },
          is_spam: { type: Type.BOOLEAN },
          spam_score: { type: Type.NUMBER },
          polarization_score: { type: Type.NUMBER },
          topic: { type: Type.STRING },
          explanation: { type: Type.STRING },
          actionable_insight: { type: Type.STRING },
          language: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          translated_text: { type: Type.STRING }
        },
        required: ["sentiment", "intensity", "toxicity", "is_sarcastic", "is_urgent", "is_spam", "spam_score", "polarization_score", "topic", "explanation", "actionable_insight", "language", "confidence", "entities"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeFile(text: string, fileData: { data: string, mimeType: string }): Promise<Partial<AnalysisResult> & { file_summary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: `Analyze the attached file in the context of this intelligence input: "${text}".
        Provide a summary of the file and how it relates to the user's input.
        Also, if the file content significantly changes the sentiment or urgency, provide updated values.` },
        {
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          file_summary: { type: Type.STRING, description: "A concise summary of the file content." },
          sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral", "sarcastic"], description: "Updated sentiment if changed by file." },
          is_urgent: { type: Type.BOOLEAN, description: "Updated urgency if changed by file." },
          confidence: { type: Type.NUMBER, description: "Confidence in file analysis." }
        },
        required: ["file_summary"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeComment(text: string, fileData?: { data: string, mimeType: string }) {
  // This is now a wrapper that can be used for backward compatibility or orchestration
  const initialAnalysis = await analyzeText(text);
  return {
    ...initialAnalysis,
    file_analysis: fileData ? "Analysis pending..." : null
  };
}
