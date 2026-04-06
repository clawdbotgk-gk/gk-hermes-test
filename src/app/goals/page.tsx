"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  target: string | null;
  deadline: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") return;
    if (status !== "authenticated") return;
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    fetch(`/api/goals?userId=${userId}`)
      .then(r => r.json())
      .then(setGoals)
      .finally(() => setLoading(false));
  }, [session, status]);

  async function createGoal() {
    if (!newTitle.trim() || !session) return;
    const userId = (session.user as any)?.id;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        target: newTarget.trim() || null,
        deadline: newDeadline || null,
      }),
    });
    if (res.ok) {
      const goal = await res.json();
      setGoals([goal, ...goals]);
      setNewTitle("");
      setNewDesc("");
      setNewTarget("");
      setNewDeadline("");
      setShowForm(false);
    }
  }

  async function toggleGoal(goal: Goal) {
    const res = await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, completed: !goal.completed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGoals(goals.map(g => g.id === goal.id ? updated : g));
    }
  }

  async function deleteGoal(id: string) {
    const res = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setGoals(goals.filter(g => g.id !== id));
    }
  }

  if (status === "unauthenticated" || loading) {
    return <PageContainer title="My Goals" description="Loading..."><div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="p-4 h-20 animate-pulse bg-muted" />)}</div></PageContainer>;
  }

  const completedCount = goals.filter(g => g.completed).length;

  return (
    <PageContainer title="My Goals" description="Set and track your training milestones">
      {/* Progress Summary */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{completedCount}/{goals.length}</div>
            <div className="text-sm text-muted-foreground">Goals completed</div>
          </div>
          <div className="flex gap-3">
            <Badge variant={goals.length === 0 ? "secondary" : "outline"}>{goals.length - completedCount} Active</Badge>
            <Badge variant="secondary">{completedCount} Completed</Badge>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Goal"}
          </Button>
        </div>
      </Card>

      {/* New Goal Form */}
      {showForm && (
        <Card className="p-4 mb-6 space-y-3">
          <h3 className="font-semibold">Create New Goal</h3>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title (e.g., Master backhand serve)" />
          <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" />
          <div className="flex gap-3">
            <Input value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="Target (e.g., 10 videos, 5 sessions)" />
            <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
          </div>
          <Button onClick={createGoal} disabled={!newTitle.trim()}>Create Goal</Button>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 && !showForm ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-2">No goals set yet</p>
          <Button variant="outline" onClick={() => setShowForm(true)}>Set your first goal</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(goal => (
            <Card key={goal.id} className={`p-4 ${goal.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => toggleGoal(goal)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${goal.completed ? "bg-primary border-primary text-white" : "border-muted-foreground"}`}
                    >
                      {goal.completed && "✓"}
                    </button>
                    <h4 className={`font-medium ${goal.completed ? "line-through text-muted-foreground" : ""}`}>{goal.title}</h4>
                  </div>
                  {goal.description && <p className="text-sm text-muted-foreground ml-7">{goal.description}</p>}
                  <div className="flex gap-3 ml-7 mt-2 text-xs text-muted-foreground">
                    {goal.target && <Badge variant="outline">Target: {goal.target}</Badge>}
                    {goal.deadline && <Badge variant="outline">Due: {new Date(goal.deadline).toLocaleDateString()}</Badge>}
                    {goal.completed && goal.completedAt && <Badge variant="secondary">Completed: {new Date(goal.completedAt).toLocaleDateString()}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>×
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
