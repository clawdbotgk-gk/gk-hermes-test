"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  items: any[];
  createdAt: string;
}

export default function TrainingPlansPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlan, setNewPlan] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/training-plans")
      .then((r) => r.json())
      .then((data) => { setPlans(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function createPlan() {
    if (!newPlan.trim()) return;
    const res = await fetch("/api/training-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlan.trim(), description: description.trim() || null }),
    });
    if (res.ok) {
      setNewPlan("");
      setDescription("");
      router.refresh();
    }
  }

  return (
    <PageContainer title="Training Plans" description="Create and manage your training plans">
      <Card className="p-4 mb-6">
        <h3 className="font-medium mb-3">Create New Training Plan</h3>
        <div className="flex gap-2">
          <Input placeholder="Plan name" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={createPlan}>Create</Button>
        </div>
      </Card>

      {loading ? (
        <p>Loading...</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No training plans yet. Create one above!</p>
        </div>
      ) : plans.map((plan) => (
        <Link key={plan.id} href={`/training-plans/${plan.id}`}>
          <Card className="p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="font-medium">{plan.name}</h3>
            {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            <Badge variant="secondary">{plan.items.length} items</Badge>
          </Card>
        </Link>
      ))}
    </PageContainer>
  );
}
