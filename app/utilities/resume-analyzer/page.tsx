"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("jobTitle", jobTitle);
      formData.append("jobDescription", jobDescription);
      formData.append("file", file);

      const res = await fetch("/api/utilities/resume-analyzer", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to analyze resume");
      setFeedback(data.feedback);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSkeleton = () => (
    <div className="grid gap-4 mt-6">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className="w-full h-20 rounded-lg bg-muted animate-pulse"
          />
        ))}
    </div>
  );

  const renderFeedbackCard = (title: string, section: FeedbackSection) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-col items-start">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Progress value={section.score} className="w-full mt-2 h-2" />
          <span className="text-xs text-muted-foreground mt-1">
            Score: {section.score}/100
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {section.tips.map((tip, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-md ${
                  tip.type === "good"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30"
                }`}
              >
                <p className="text-sm font-medium">{tip.tip}</p>
                {tip.explanation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tip.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-center mb-2">
        Resume Analyzer (AI-Powered)
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload your resume and get an AI-driven evaluation based on ATS, tone,
        structure, and skills.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-card p-6 rounded-lg shadow-md border border-border"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Company Name
            </label>
            <Input
              placeholder="e.g., AIMPACT"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <Input
              placeholder="e.g., AI Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Job Description
          </label>
          <Textarea
            placeholder="Paste the job description or role summary here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Resume (PDF)
          </label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Analyzing Resume..." : "Analyze Resume"}
        </Button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30">
          {error}
        </div>
      )}

      {/* Results Section */}
      {loading && renderSkeleton()}

      {!loading && feedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-10 space-y-6"
        >
          <Card className="border border-border bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-center">
                Overall Resume Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <motion.div
                className="text-5xl font-semibold text-primary"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150 }}
              >
                {feedback.overallScore}
              </motion.div>
              <Progress
                value={feedback.overallScore}
                className="w-1/2 mt-4 h-2"
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {renderFeedbackCard("ATS Compatibility", feedback.ATS)}
            {renderFeedbackCard("Tone & Style", feedback.toneAndStyle)}
            {renderFeedbackCard("Content", feedback.content)}
            {renderFeedbackCard("Structure", feedback.structure)}
            {renderFeedbackCard("Skills", feedback.skills)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
