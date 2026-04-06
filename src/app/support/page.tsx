"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FAQS = [
  { q: "How do I add players to a tournament?", a: "Open a tournament in draft status, use the 'Add Players' form to enter player names, then generate the draw." },
  { q: "What draw types are supported?", a: "We support knockout, round-robin, double-knockout, and groups-then-knockout formats." },
  { q: "How do I track my training progress?", a: "Go to My Profile to set your skill level and goals, then use the Analytics dashboard to track completion rates." },
  { q: "Can coaches assign training plans?", a: "Yes. Coaches can create training plans and add video/library items for students to follow." },
  { q: "How do I bookmark coaching videos?", a: "On any video page, click the bookmark icon to save it to your library for quick access later." },
];

export default function SupportPage() {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState((session?.user as any)?.email || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const userId = (session?.user as any)?.id || null;
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: email || (session?.user as any)?.email, subject: subject.trim(), message: message.trim() }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer title="Support & Feedback" description="Get help, browse FAQs, or send us feedback">
      <Tabs defaultValue="faq" className="mt-2">
        <TabsList>
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="feedback">Send Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-4 space-y-3">
          {FAQS.map((faq, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-medium mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card className="max-w-lg p-6">
            <h3 className="font-semibold mb-4">Contact Support</h3>
            {submitted ? (
              <div className="text-center py-8">
                <Badge variant="default" className="mb-3">Submitted</Badge>
                <p className="text-muted-foreground">Your message has been sent. We'll get back to you soon.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}>Send another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe your issue" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message *</label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Provide details about your issue..." />
                </div>
                {email && (
                  <p className="text-xs text-muted-foreground">Reply to: {email}</p>
                )}
                <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <Card className="max-w-lg p-6">
            <h3 className="font-semibold mb-4">Send Feedback</h3>
            {submitted ? (
              <div className="text-center py-8">
                <Badge variant="default" className="mb-3">Thank you!</Badge>
                <p className="text-muted-foreground">Your feedback helps us improve the app.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">What's on your mind? *</label>
                  <Textarea value={subject} onChange={e => setSubject(e.target.value)} rows={1} placeholder="Feature request, bug report, suggestion..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Details</label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Elaborate on your feedback..." />
                </div>
                <Button type="submit" disabled={submitting || !subject.trim()}>
                  {submitting ? "Sending..." : "Submit Feedback"}
                </Button>
              </form>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
