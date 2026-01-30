import z from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { RenewExpiredJwtRequestDto } from "./jwt.dto";

export const renewExpiredJwtRequestSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtRequestDto> =
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("convention"),
      originalUrl: z.string(),
      expiredJwt: z.string(),
    }),
    z.object({
      kind: z.literal("connectedUser"),
      expiredJwt: z.string(),
    }),
    z.object({
      kind: z.literal("emailAuthCode"),
      expiredJwt: z.string(),
      state: z.string(),
    }),
  ]);
