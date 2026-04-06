"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  skillLevel?: string | null;
  goals?: string | null;
  totalVideosWatched: number;
  totalPlansCompleted: number;
  bookmarksCount: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [skillLevel, setSkillLevel] = useState("");
  const [goals, setGoals] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/profile");
      return;
    }
    if (status === "authenticated") {
      // Load profile + stats from API
      fetch("/api/profile")
        .then(r => r.json())
        .then(data => {
          setProfile(data);
          setSkillLevel(data.skillLevel || "");
          setGoals(data.goals || "");
        })
        .catch(() => setProfile(null));
    }
  }, [status, router]);

  async function saveProfile() {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillLevel, goals }),
    });
    if (res.ok) {
      setEditing(false);
      const updated = await res.json();
      setProfile(updated);
    }
  }

  if (status === "loading" || !session) {
    return <PageContainer><p>Loading...</p></PageContainer>;
  }

  return (
    <PageContainer title="My Profile" description="Your account and training progress">
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
              {(session.user as any)?.name?.[0]?.toUpperCase() || (session.user as any)?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="font-medium">{(session.user as any)?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{(session.user as any)?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Skill Level</label>
                <Input value={skillLevel} onChange={e => setSkillLevel(e.target.value)} placeholder="e.g., intermediate" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Goals</label>
                <Input value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g., improve serve, footwork" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProfile}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {profile?.skillLevel && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Level:</span>
                  <Badge>{profile.skillLevel}</Badge>
                </div>
              )}
              {profile?.goals && (
                <div>
                  <span className="text-sm text-muted-foreground">Goals: </span>
                  <span className="text-sm">{profile.goals}</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-3">Training Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{profile?.totalVideosWatched || 0}</div>
              <div className="text-xs text-muted-foreground">Videos Watched</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile?.bookmarksCount || 0}</div>
              <div className="text-xs text-muted-foreground">Bookmarks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile?.totalPlansCompleted || 0}</div>
              <div className="text-xs text-muted-foreground">Plans Done</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <a href="/videos"><Button variant="outline">Browse Videos</Button></a>
        <a href="/training-plans"><Button variant="outline">My Training Plans</Button></a>
        <a href="/bookmarks"><Button variant="outline">Saved Videos</Button></a>
      </div>
    </PageContainer>
  );
}
