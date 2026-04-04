"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

const FORMATS = [
  { value: "knockout", label: "Single Knockout", desc: "Lose and you are out. Simple and fast." },
  { value: "round-robin", label: "Round Robin", desc: "Everyone plays everyone. Fair and complete." },
  { value: "double-knockout", label: "Double Knockout", desc: "Winners + losers bracket. Second chance." },
  { value: "groups-then-knockout", label: "Groups + Knockout", desc: "Group stage then knockout playoffs." },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await fetch("/api/tournaments", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(formData)),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (data.success) {
          router.push(`/tournaments/${data.tournamentId}`);
        } else {
          setError(data.error || "Something went wrong");
        }
      } catch {
        setError("Failed to create tournament");
      }
    });
  }

  return (
    <PageContainer title="New Tournament" description="Set up your table tennis tournament.">
      <Card className="max-w-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Ormeau Club Championship" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="Details about the tournament..." />
          </div>

          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup name="type" defaultValue="knockout" required>
              {FORMATS.map((f) => (
                <div key={f.value} className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value={f.value} id={f.value} className="mt-1" />
                  <label htmlFor={f.value} className="flex-1 cursor-pointer">
                    <div className="font-medium">{f.label}</div>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players (optional)</Label>
            <Input id="maxPlayers" name="maxPlayers" type="number" min="2" placeholder="No limit" />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Tournament"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
