import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        const matches = await prisma.match.findMany({
          where: { tournamentId: id },
          include: { player1: { include: { player: true } }, player2: { include: { player: true } }, gameScores: true },
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        });
        const data = JSON.stringify({ type: "update", matches, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`id: ${Date.now()}\ndata: ${data}\n\n`));
      };
      await sendUpdate();
      const interval = setInterval(sendUpdate, 3000);
      request.signal.addEventListener("abort", () => { clearInterval(interval); controller.close(); });
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
