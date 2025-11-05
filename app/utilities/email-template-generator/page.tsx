"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash, Copy, Download } from "lucide-react";

export default function EmailGenerator() {
  const [tone, setTone] = useState("formal");
  const [type, setType] = useState("business");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [company, setCompany] = useState("");
  const [template, setTemplate] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  // 🔹 Predefined templates
  const templates = {
    invoice: {
      label: "Invoice / Payment Reminder",
      tone: "formal",
      type: "business",
      keyPoints: [
        "Include invoice number and due date",
        "Mention total amount payable",
        "Provide payment link or bank details",
        "Add polite reminder about payment terms",
      ],
    },
    login: {
      label: "Login Verification / OTP",
      tone: "neutral",
      type: "notification",
      keyPoints: [
        "Include 6-digit OTP or verification code",
        "Mention validity time (e.g., valid for 10 minutes)",
        "Remind not to share code with anyone",
        "Include support contact link",
      ],
    },
    account_creation: {
      label: "Account Creation / Welcome Email",
      tone: "friendly",
      type: "onboarding",
      keyPoints: [
        "Welcome the new user warmly",
        "Confirm successful account creation",
        "Provide login link or getting started guide",
        "Encourage engagement with your platform",
      ],
    },
    newsletter: {
      label: "Newsletter / Update Email",
      tone: "casual",
      type: "marketing",
      keyPoints: [
        "Share latest company news or blog posts",
        "Highlight product updates or offers",
        "Encourage following on social media",
        "Add unsubscribe link at the end",
      ],
    },
    password_reset: {
      label: "Password Reset / Security Email",
      tone: "neutral",
      type: "security",
      keyPoints: [
        "Include password reset link",
        "Mention expiration time for the link",
        "Reassure user if they didn’t request it",
        "Include contact info for support",
      ],
    },
  };

  function handleTemplateSelect(value: string) {
    setTemplate(value);
    const t = templates[value as keyof typeof templates];
    if (!t) return;
    setTone(t.tone);
    setType(t.type);
    setKeyPoints(t.keyPoints);
  }

  function updateKeyPoint(i: number, val: string) {
    setKeyPoints((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  }

  function addKeyPoint() {
    setKeyPoints((prev) => [...prev, ""]);
  }

  function removeKeyPoint(i: number) {
    setKeyPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHtml(null);
    setLoading(true);

    try {
      const res = await fetch("/api/utilities/email-template-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          type,
          recipient,
          sender,
          company,
          template,
          keyPoints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to generate email.");
        setLoading(false);
        return;
      }

      setHtml(data.html?.replace("```html", "")?.replace("```", ""));
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function copyHtml() {
    if (!html) return;
    navigator.clipboard.writeText(html);
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "email-template.html";
    link.click();
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">
        AI Email Template Generator
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selector */}
            <div>
              <Label>Select a Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templates).map(([key, t]) => (
                    <SelectItem key={key} value={key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tone</Label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>

            <div>
              <Label>Type</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>

            <div>
              <Label>Recipient</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Client name or role"
              />
            </div>

            <div>
              <Label>Sender</Label>
              <Input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Your name or team"
              />
            </div>

            <div>
              <Label>Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
              />
            </div>

            <Separator />

            <div>
              <Label>Key Points</Label>
              <div className="space-y-2 mt-2">
                {keyPoints.map((kp, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={kp}
                      onChange={(e) => updateKeyPoint(i, e.target.value)}
                      placeholder={`Key point ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeKeyPoint(i)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addKeyPoint}
                className="mt-2"
              >
                <Plus size={14} className="mr-2" />
                Add Key Point
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Generate Email
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHtml(null);
                  setKeyPoints([""]);
                  setRecipient("");
                  setSender("");
                  setCompany("");
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Email</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin" />
              </div>
            )}

            {!loading && html && (
              <>
                <div className="flex gap-2 mb-2">
                  <Button onClick={copyHtml}>
                    <Copy size={14} className="mr-2" /> Copy
                  </Button>
                  <Button onClick={downloadHtml}>
                    <Download size={14} className="mr-2" /> Download
                  </Button>
                </div>

                <Textarea
                  value={html}
                  readOnly
                  className="h-40 font-mono text-sm"
                />
                <iframe
                  srcDoc={html}
                  className="w-full h-96 border rounded-md mt-4"
                />
              </>
            )}

            {!loading && !html && (
              <p className="text-sm text-muted-foreground text-center">
                Your generated email will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
