import z from "zod";
import type { RenewExpiredJwtResponse } from "../convention/convention.dto";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  expiredJwtErrorMessage,
  type RenewExpiredJwtRequestDto,
  unsupportedMagicLinkErrorMessage,
} from "./jwt.dto";

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

export const renewExpiredJwtResponseSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtResponse> =
  z.object({
    message: z
      .literal(expiredJwtErrorMessage)
      .or(z.literal(unsupportedMagicLinkErrorMessage)),
    needsNewMagicLink: z.boolean(),
  });
