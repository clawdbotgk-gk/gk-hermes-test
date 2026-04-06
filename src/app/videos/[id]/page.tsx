"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  skillLevel: string;
  duration: number | null;
  storagePath: string;
  thumbnailUrl: string | null;
  published: boolean;
  createdAt: string;
  tags: { id: string; name: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
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

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    fetch(`/api/videos/${id}`)
      .then(r => r.json())
      .then(data => { setVideo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params]);

  if (loading) return <PageContainer><p>Loading video...</p></PageContainer>;
  if (!video) return <PageContainer><p>Video not found</p></PageContainer>;

  return (
    <PageContainer title={video.title} description={video.description || undefined}>
      <div className="mb-4 flex items-center gap-3">
        <Badge variant="outline">{CATEGORY_LABELS[video.category] || video.category}</Badge>
        <Badge variant={video.skillLevel === "beginner" ? "outline" : video.skillLevel === "intermediate" ? "secondary" : "default"}>
          {video.skillLevel}
        </Badge>
        {video.duration && (
          <span className="text-sm text-muted-foreground">{formatDuration(video.duration)}</span>
        )}
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        <video
          className="w-full aspect-video"
          controls
          controlsList="nodownload"
          preload="metadata"
          playsInline
          onRateChange={(e) => console.log("Speed:", (e.target as HTMLVideoElement).playbackRate)}
        >
          <source src={`/api/storage/${video.storagePath}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Custom Speed Control Overlay */}
        <div className="absolute bottom-16 right-4">
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="bg-black/70 hover:bg-black/90 text-white text-xs"
            >
              {playbackSpeed}x
            </Button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[80px]">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      const v = document.querySelector("video");
                      if (v) v.playbackRate = speed;
                      setPlaybackSpeed(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`block w-full text-left px-2 py-1 text-sm text-white hover:bg-white/20 rounded ${playbackSpeed === speed ? "font-semibold text-primary" : ""}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Tags */}
      <Card className="p-4">
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {video.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
          </div>
        )}
        {video.description && (
          <p className="text-muted-foreground leading-relaxed">{video.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Uploaded {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </Card>

      <div className="mt-4">
        <Button variant="ghost" onClick={() => router.back()}>
          &larr; Back to Videos
        </Button>
      </div>
    </PageContainer>
  );
}
