"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsData {
  period: string;
  videoBookmarks: number;
  trainingPlans: number;
  completedItems: number;
  totalItems: number;
  completionRate: number;
  weeklyActivity: { week: string; completed: number }[];
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </Card>
  );
}

export default function AnalyticsPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || "loading";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") return;
    if (status !== "authenticated") return;
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    setLoading(true);
    fetch(`/api/analytics?userId=${userId}&period=${period}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [session, status, period]);

  const maxActivity = Math.max(...(data?.weeklyActivity.map(a => a.completed) || [1]), 1);

  if (status === "unauthenticated" || loading) {
    return <PageContainer title="Analytics" description="Loading your training data..."><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Card key={i} className="p-4 h-28 animate-pulse bg-muted" />)}</div></PageContainer>;
  }

  return (
    <PageContainer title="Training Analytics" description="Track your progress and training patterns">
      <div className="flex justify-end mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Videos Bookmarked" value={data?.videoBookmarks || 0} />
        <StatCard label="Training Plans" value={data?.trainingPlans || 0} />
        <StatCard label="Lessons Completed" value={data?.completedItems || 0} subtext={`of ${data?.totalItems || 0} total`} />
        <StatCard label="Completion Rate" value={`${data?.completionRate || 0}%`} />
      </div>

      {/* Weekly Activity Chart */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Weekly Activity</h3>
        {data?.weeklyActivity && data.weeklyActivity.length > 0 ? (
          <div className="flex items-end gap-3 h-40">
            {data.weeklyActivity.map((entry, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground">{entry.completed}</div>
                <div
                  className="w-full bg-primary rounded-t transition-all min-h-[2px]"
                  style={{ height: `${Math.max((entry.completed / maxActivity) * 120, 4)}px` }}
                />
                <div className="text-xs text-muted-foreground truncate w-full text-center">{entry.week}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No training data yet. Start completing lessons to see your activity.</p>
        )}
      </Card>

      {/* Skill Progress Guidance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Next Steps</h3>
        <div className="space-y-2">
          {(data?.completedItems || 0) === 0 && (
            <p className="text-sm text-muted-foreground">Browse coaching videos and add them to a training plan to get started.</p>
          )}
          {(data?.completionRate || 0) > 0 && (data?.completionRate || 0) < 50 && (
            <p className="text-sm text-muted-foreground">You're making progress! Focus on completing your current training plans before starting new ones.</p>
          )}
          {(data?.completionRate || 0) >= 50 && (data?.completionRate || 0) < 100 && (
            <p className="text-sm text-muted-foreground">Great progress! You're over halfway through your training. Keep going!</p>
          )}
          {(data?.completionRate || 0) === 100 && (
            <p className="text-sm text-muted-foreground">All training items completed! Consider setting new goals or exploring advanced content.</p>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
// NOTE: Coach view needs to be added as a separate route
