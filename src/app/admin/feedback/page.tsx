"use client";

import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Feedback {
  id: string;
  userId: string | null;
  email: string | null;
  subject: string;
  message: string | null;
  type: string;
  status: string;
  response: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "default",
  in_progress: "secondary",
  resolved: "outline",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("new");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const loadFeedback = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/feedback?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setFeedback(data.feedback || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setFeedback(fb => fb.map(f => f.id === id ? { ...f, status } : f));
  }

  async function submitResponse(id: string) {
    if (!responseText.trim()) return;
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseText.trim(), status: "resolved" }),
    });
    setRespondingId(null);
    setResponseText("");
    loadFeedback();
  }

  return (
    <PageContainer title="Feedback & Support Tickets" description="Review and respond to user feedback">
      <div className="flex gap-2 mb-4">
        {["new", "in_progress", "resolved"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s.replace("_", " ")}
          </Button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : feedback.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-muted-foreground">No feedback found with this filter.</p></Card>
      ) : (
        <div className="space-y-3">
          {feedback.map(f => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{f.subject}</h4>
                    <Badge variant={STATUS_COLORS[f.status] as any}>{f.status}</Badge>
                    <Badge variant="outline">{f.type}</Badge>
                  </div>
                  {f.message && <p className="text-sm text-muted-foreground mb-2">{f.message}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {f.user && <span>From: {f.user.name || f.email || "Anonymous"}</span>}
                    {!f.user && f.email && <span>Email: {f.email}</span>}
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  {f.response && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <span className="font-medium">Response: </span>{f.response}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {f.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(f.id, "in_progress")}>
                      Mark In Progress
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setRespondingId(f.id === respondingId ? null : f.id)}>
                    {respondingId === f.id ? "Cancel" : "Respond"}
                  </Button>
                </div>
              </div>
              {respondingId === f.id && (
                <div className="mt-3 space-y-2">
                  <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Your response..." rows={3} />
                  <Button size="sm" onClick={() => submitResponse(f.id)} disabled={!responseText.trim()}>
                    Send & Resolve
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
