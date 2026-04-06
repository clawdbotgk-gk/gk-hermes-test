"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["serve", "footwork", "strokes", "match-prep"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];
const CATEGORY_LABELS: Record<string, string> = {
  serve: "Serve",
  footwork: "Footwork",
  strokes: "Strokes",
  "match-prep": "Match Preparation",
};

export default function NewVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("serve");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [tagsInput, setTagsInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !file) {
      setStatus("Please provide a title and select a video file.");
      return;
    }
    setUploading(true);
    setProgress(10);
    setStatus("Creating video record...");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          skillLevel,
          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
          filename: file.name,
        }),
      });

      const data = await res.json();
      setProgress(100);

      if (!res.ok) {
        setStatus(data.error || "Failed to create video record.");
        setUploading(false);
        return;
      }

      setStatus("Video record created successfully! You can now add the video to the library.");
      setTimeout(() => router.push("/videos"), 2000);
    } catch (err) {
      setStatus("An error occurred.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <PageContainer title="Add Coaching Video" description="Add a new training video to the library">
      <Card className="max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Topspin forehand basics" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the coaching content" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Skill Level</label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., forehand, topspin, basics" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Video File (for reference)</label>
            <Input ref={fileRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          {uploading && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {status && (
            <p className="text-sm text-muted-foreground">{status}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>
              {uploading ? "Adding..." : "Add Video"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/videos")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
