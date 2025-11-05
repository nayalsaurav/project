import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { tone, type, recipient, sender, company, keyPoints, template } =
      await req.json();

    // Handle missing key points or template fallback
    if (
      (!keyPoints || !Array.isArray(keyPoints) || keyPoints.length === 0) &&
      !template
    ) {
      return NextResponse.json(
        { error: "Please provide key points or select a template." },
        { status: 400 }
      );
    }

    // Optional: predefined template boilerplate (safe fallback)
    const templateDescriptions: Record<string, string> = {
      invoice: `An invoice or payment reminder email that includes billing details, amount due, due date, polite tone, and payment link.`,
      login: `A login verification or OTP email that includes a verification code, its expiry, and a security reminder not to share the code.`,
      account_creation: `A warm welcome email confirming account creation and introducing the platform’s main features.`,
      newsletter: `A newsletter-style email with recent updates, product highlights, and social media links.`,
      password_reset: `A password reset email with a secure reset link, expiry information, and safety tips.`,
    };

    const templateContext =
      template && templateDescriptions[template]
        ? `This is a ${template} email. ${templateDescriptions[template]}`
        : "";

    // ✅ Construct the AI prompt dynamically
    const prompt = `
You are an expert HTML email copywriter and designer.

${templateContext}

Write a ${tone || "formal"} ${type || "business"} email in **HTML format** from
${sender || "a professional"} at ${company || "an organization"} to ${
      recipient || "a client"
    }.

The email must include these key points naturally:
${
  keyPoints && keyPoints.length
    ? keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")
    : "(use suitable points for this template)"
}

Formatting instructions:
- Output only clean, responsive HTML using inline CSS.
- Include a styled header (company name or AI branding), greeting, email body, and closing signature.
- Do not include <html>, <head>, or <body> tags — just the email content section.
- Avoid external CSS, JS, or placeholders like [company].
`;

    // ✅ Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Gemini API result parsing
    const htmlOutput =
      response.text || response?.candidates?.[0]?.content || "";

    if (!htmlOutput) {
      return NextResponse.json(
        { error: "No HTML generated from Gemini." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      html: htmlOutput,
    });
  } catch (error: any) {
    console.error("Gemini HTML Email API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
