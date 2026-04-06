"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  skillLevel: string;
  videosBookmarked: number;
  trainingPlans: number;
  completedItems: number;
  completionRate: number;
  lastActive: string;
}

export default function CoachAnalyticsPage() {
  const session = useSession();
  const status = session?.status || "loading";
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = (window as any).__CTO_COACH_ID || "coach-default";
    fetch(`/api/analytics/coach?coachId=${userId}`)
      .then(r => r.json())
      .then(data => { setStudents(data.students || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (status === "unauthenticated" || loading) {
    return <PageContainer title="Coach Dashboard"><p>Loading student data...</p></PageContainer>;
  }

  return (
    <PageContainer title="Coach Dashboard" description="Monitor student engagement and progress">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{students.length}</div>
          <div className="text-sm font-medium mt-1">Total Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{students.filter(s => s.lastActive !== "Never").length}</div>
          <div className="text-sm font-medium mt-1">Active Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {students.length > 0 ? Math.round(students.reduce((a, s) => a + s.completionRate, 0) / students.length) : 0}%
          </div>
          <div className="text-sm font-medium mt-1">Avg Completion</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {students.reduce((a, s) => a + s.videosBookmarked, 0)}
          </div>
          <div className="text-sm font-medium mt-1">Videos Bookmarked</div>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Student Progress</h3>
        {students.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No student data available yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Videos</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{s.studentName || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{s.studentEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.skillLevel || "-"}</Badge></TableCell>
                  <TableCell>{s.videosBookmarked}</TableCell>
                  <TableCell>{s.trainingPlans}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.completionRate >= 80 ? "bg-green-500" : s.completionRate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${s.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs">{s.completionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}
