"use client";

import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  duration: number | null;
  thumbnailUrl: string | null;
  storagePath: string;
  published: boolean;
  createdAt: string;
  tags: { id: string; name: string }[];
}

const CATEGORIES = ["all", "serve", "footwork", "strokes", "match-prep"];
const SKILL_LEVELS = ["all", "beginner", "intermediate", "advanced"];
const CATEGORY_LABELS: Record<string, string> = {
  all: "All Categories",
  serve: "Serve",
  footwork: "Footwork",
  strokes: "Strokes",
  "match-prep": "Match Preparation",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [skillLevel, setSkillLevel] = useState("all");

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category !== "all") params.set("category", category);
      if (skillLevel !== "all") params.set("skillLevel", skillLevel);

      const res = await fetch(`/api/videos?${params.toString()}`);
      const data = await res.json();
      setVideos(data);
    } finally {
      setLoading(false);
    }
  }, [search, category, skillLevel]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const skillBadgeVariant = (level: string) => {
    switch (level) {
      case "beginner": return "outline";
      case "intermediate": return "secondary";
      case "advanced": return "default";
      default: return "outline";
    }
  };

  return (
    <PageContainer title="Coaching Videos" description="Video library with coaching content from Anders Lind">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search videos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={skillLevel} onValueChange={setSkillLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="h-40 bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No videos found</p>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-medium">{CATEGORY_LABELS[video.category] || video.category}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium line-clamp-2">{video.title}</h3>
                    <Badge variant={skillBadgeVariant(video.skillLevel)} className="text-xs shrink-0">
                      {video.skillLevel}
                    </Badge>
                  </div>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(video.duration)}</span>
                    {video.tags.length > 0 && (
                      <span className="truncate">{video.tags.map((t) => t.name).join(", ")}</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
