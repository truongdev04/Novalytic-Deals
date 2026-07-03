import { z } from "zod";

export const voteSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export type VoteInput = z.infer<typeof voteSchema>;
