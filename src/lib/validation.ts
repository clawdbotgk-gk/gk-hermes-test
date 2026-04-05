import { z } from "zod";

// Zod schemas for input validation on all API endpoints

export const tournamentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(["knockout", "round-robin", "double-knockout", "groups-then-knockout"]),
  maxPlayers: z.number().int().min(2).max(1000).optional().nullable(),
  ownerId: z.string().cuid().optional().nullable(),
});

export const tournamentUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(["knockout", "round-robin", "double-knockout", "groups-then-knockout"]).optional(),
  maxPlayers: z.number().int().min(2).max(1000).nullable().optional(),
  status: z.enum(["draft", "in-progress", "completed", "cancelled"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const playerCreateSchema = z.object({
  name: z.string().min(1, "Player name is required").max(150, "Player name too long (max 150 chars)"),
  email: z.string().email("Invalid email format").max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  seed: z.number().int().min(1).max(10000).optional().nullable(),
});

export const bulkPlayerCreateSchema = z.object({
  players: z.array(playerCreateSchema).min(1).max(100, "Cannot add more than 100 players at once"),
});

export const gameScoreSchema = z.object({
  gameNumber: z.number().int().min(1),
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
  _tag: z.literal("score").optional(),
});

export const scoreUpdateSchema = z.object({
  gameScores: z.array(gameScoreSchema).min(1),
});

export const drawGenerateSchema = z.object({
  type: z.enum(["knockout", "round-robin", "double-knockout", "groups-then-knockout"]).optional(),
  groupSize: z.number().int().min(2).max(10).optional(),
  teamsPerKnockout: z.number().int().min(2).optional(),
}).optional();

// Helper function to validate request body and return parsed data or error response
export async function validateRequest(request: Request, schema: z.ZodSchema) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      return {
        error: true,
        response: new Response(
          JSON.stringify({ error: `Validation failed: ${firstError || "Invalid input"}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        data: null as any,
      };
    }
    return { error: false, response: null, data: result.data };
  } catch (e) {
    return {
      error: true,
      response: new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
      data: null as any,
    };
  }
}

// Validate params (tournament ID must be a valid CUID)
export const tournamentIdSchema = z.string().cuid("Invalid tournament ID format");
export const matchIdSchema = z.string().cuid("Invalid match ID format");
