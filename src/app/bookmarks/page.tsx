"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface Bookmark {
  id: string;
  videoId: string;
  bookmarkedAt: string;
  video: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    skillLevel: string;
    duration: number | null;
    thumbnailUrl: string | null;
  };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BookmarksPage() {
  const { status } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/bookmarks");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/bookmarks")
        .then(r => r.json())
        .then(data => { setBookmarks(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function removeBookmark(videoId: string) {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, action: "remove" }),
    });
    setBookmarks(prev => prev.filter(b => b.videoId !== videoId));
  }

  if (status === "loading" || loading) {
    return <PageContainer><p>Loading...</p></PageContainer>;
  }

  return (
    <PageContainer title="Saved Videos" description="Your bookmarked coaching videos">
      {bookmarks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No saved videos yet</p>
          <p>
            <Link href="/videos" className="text-primary hover:underline">Browse videos</Link> and bookmark ones you like
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="overflow-hidden p-3">
              <Link href={`/videos/${bookmark.videoId}`}>
                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded mb-3 flex items-center justify-center">
                  {bookmark.video.thumbnailUrl ? (
                    <img src={bookmark.video.thumbnailUrl} alt={bookmark.video.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    <span className="text-primary text-sm">{bookmark.video.category}</span>
                  )}
                </div>
              </Link>
              <h3 className="font-medium text-sm line-clamp-1">{bookmark.video.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{bookmark.video.skillLevel}</Badge>
                <span className="text-xs text-muted-foreground">{formatDuration(bookmark.video.duration)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-red-600 hover:text-red-700"
                onClick={() => removeBookmark(bookmark.videoId)}
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
