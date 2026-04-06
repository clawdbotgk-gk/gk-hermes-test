"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox" || "☐";

interface PlanItem {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  completedAt: string | null;
  video: { id: string; title: string; duration: number | null } | null;
}

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  items: PlanItem[];
  createdAt: string;
}

export default function TrainingPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/training-plans/${params.id}`)
      .then(r => r.json())
      .then(data => { setPlan(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params]);

  async function addItem() {
    if (!newItemTitle.trim() || !plan) return;
    const res = await fetch(`/api/training-plans/${plan.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newItemTitle.trim() }),
    });
    if (res.ok) {
      const item = await res.json();
      setPlan(prev => prev ? { ...prev, items: [...prev.items, item] } : null);
      setNewItemTitle("");
    }
  }

  async function toggleComplete(item: PlanItem) {
    const res = await fetch(`/api/training-plans/${item.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: item.completedAt ? null : new Date().toISOString() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlan(prev => prev ? { ...prev, items: prev.items.map(i => i.id === updated.id ? updated : i) } : null);
    }
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/training-plans/${itemId}/items`, { method: "DELETE" });
    setPlan(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null);
  }

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (!plan) return <PageContainer><p>Training plan not found</p></PageContainer>;

  const completedCount = plan.items.filter(i => i.completedAt).length;
  const progress = plan.items.length > 0 ? Math.round((completedCount / plan.items.length) * 100) : 0;

  return (
    <PageContainer title={plan.name} description={plan.description || undefined}>
      {/* Progress bar */}
      <Card className="p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{completedCount} of {plan.items.length} completed</span>
          <span className="text-sm font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {/* Add item */}
      <div className="flex gap-2 mb-4">
        <Input placeholder="Add training item..." value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
        <Button onClick={addItem}>Add</Button>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {plan.items.map((item) => (
          <Card key={item.id} className={`p-3 ${item.completedAt ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleComplete(item)} className="text-lg">
                {item.completedAt ? "✅" : "⬜"}
              </button>
              <div className="flex-1">
                <span className={item.completedAt ? "line-through" : ""}>{item.title}</span>
                {item.video && (
                  <div className="text-xs text-muted-foreground">
                    <a href={`/videos/${item.video.id}`} className="text-primary hover:underline">{item.video.title}</a>
                    {item.video.duration && (
                      <span> · {Math.floor(item.video.duration / 60)}:{(item.video.duration % 60).toString().padStart(2, "0")}</span>
                    )}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteItem(item.id)}>✕</Button>
            </div>
          </Card>
        ))}
        {plan.items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No items yet. Add training items above.</p>
        )}
      </div>
    </PageContainer>
  );
}
