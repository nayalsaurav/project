import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

/* ------------------------------ Interfaces ------------------------------ */

interface FeedbackTip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

interface FeedbackSection {
  score: number;
  tips: FeedbackTip[];
}

interface Feedback {
  overallScore: number;
  ATS: FeedbackSection;
  toneAndStyle: FeedbackSection;
  content: FeedbackSection;
  structure: FeedbackSection;
  skills: FeedbackSection;
}

/* ------------------------------ Initialize Gemini ------------------------------ */

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

/* ------------------------------ Schema Definition ------------------------------ */

const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    ATS: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        tips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["good", "improve"] },
              tip: { type: Type.STRING },
            },
            required: ["type", "tip"],
          },
        },
      },
      required: ["score", "tips"],
    },
    toneAndStyle: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        tips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["good", "improve"] },
              tip: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["type", "tip", "explanation"],
          },
        },
      },
      required: ["score", "tips"],
    },
    content: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        tips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["good", "improve"] },
              tip: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["type", "tip", "explanation"],
          },
        },
      },
      required: ["score", "tips"],
    },
    structure: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        tips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["good", "improve"] },
              tip: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["type", "tip", "explanation"],
          },
        },
      },
      required: ["score", "tips"],
    },
    skills: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        tips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["good", "improve"] },
              tip: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["type", "tip", "explanation"],
          },
        },
      },
      required: ["score", "tips"],
    },
  },
  required: [
    "overallScore",
    "ATS",
    "toneAndStyle",
    "content",
    "structure",
    "skills",
  ],
} as const;

/* ------------------------------ Helper: Error Feedback ------------------------------ */

function createErrorFeedback(): Feedback {
  return {
    overallScore: 0,
    ATS: {
      score: 0,
      tips: [{ type: "improve", tip: "Unable to analyze resume." }],
    },
    toneAndStyle: {
      score: 0,
      tips: [{ type: "improve", tip: "Unable to analyze tone." }],
    },
    content: {
      score: 0,
      tips: [{ type: "improve", tip: "Unable to analyze content." }],
    },
    structure: {
      score: 0,
      tips: [{ type: "improve", tip: "Unable to analyze structure." }],
    },
    skills: {
      score: 0,
      tips: [{ type: "improve", tip: "Unable to analyze skills." }],
    },
  };
}

/* ------------------------------ Helper: Validation ------------------------------ */

function validateInputs({
  companyName,
  jobTitle,
  jobDescription,
  file,
}: {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  file: File;
}) {
  const errors: string[] = [];

  if (!companyName?.trim()) errors.push("Company name is required");
  if (!jobTitle?.trim()) errors.push("Job title is required");
  if (!jobDescription?.trim()) errors.push("Job description is required");

  if (!file) errors.push("Resume file is required");
  else if (file.type !== "application/pdf")
    errors.push("Only PDF files are supported");
  else if (file.size > 10 * 1024 * 1024)
    errors.push("File size must be less than 10MB");

  if (errors.length > 0) throw new Error(errors.join(", "));
}

/* ------------------------------ Helper: Prompt Builder ------------------------------ */

function prepareInstructions({
  companyName,
  jobTitle,
  jobDescription,
}: {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}) {
  return `
You are an expert ATS (Applicant Tracking System) and resume analysis specialist.

CONTEXT:
- Company: ${companyName}
- Position: ${jobTitle}
- Job Description: ${jobDescription}

TASK:
Analyze the uploaded resume in PDF format and provide a structured evaluation.

EVALUATION CATEGORIES:
1. ATS (Applicant Tracking System) Compatibility
2. Tone & Style
3. Content Relevance
4. Structure & Formatting
5. Skills Presentation

REQUIREMENTS:
- Score each category from 0–100.
- Provide 3–4 concise, actionable tips for each section.
- Distinguish between positive (good) and improvement (improve) feedback.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown or extra commentary) matching this schema:

{
  "overallScore": number,
  "ATS": { "score": number, "tips": [{ "type": "good" | "improve", "tip": "string" }] },
  "toneAndStyle": { "score": number, "tips": [{ "type": "good" | "improve", "tip": "string", "explanation": "string" }] },
  "content": { "score": number, "tips": [{ "type": "good" | "improve", "tip": "string", "explanation": "string" }] },
  "structure": { "score": number, "tips": [{ "type": "good" | "improve", "tip": "string", "explanation": "string" }] },
  "skills": { "score": number, "tips": [{ "type": "good" | "improve", "tip": "string", "explanation": "string" }] }
}
`;
}

/* ------------------------------ Main Analyzer ------------------------------ */

async function analyzeResume(
  file: File,
  instruction: string
): Promise<Feedback> {
  let jsonOutput = "";

  try {
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const response = await ai.models.generateContent({
      model: process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: instruction },
            {
              inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: resumeAnalysisSchema,
      },
    });

    jsonOutput = response?.text ?? "";
    if (!jsonOutput) throw new Error("Empty AI response");

    return JSON.parse(jsonOutput) as Feedback;
  } catch (error) {
    console.error("Gemini Resume Analysis Error:", error);
    return createErrorFeedback();
  }
}

/* ------------------------------ API Route ------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const companyName = formData.get("companyName") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;
    const file = formData.get("file") as File;

    validateInputs({ companyName, jobTitle, jobDescription, file });

    const instruction = prepareInstructions({
      companyName,
      jobTitle,
      jobDescription,
    });

    const feedback = await analyzeResume(file, instruction);

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("Resume Analyzer API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
