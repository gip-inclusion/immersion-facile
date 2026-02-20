import z from "zod";
import type { RenewExpiredJwtResponse } from "../convention/convention.dto";
import { makeHardenedStringSchema } from "../utils/string.schema";
import { zUuidLike } from "../utils/uuid";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  expiredJwtErrorMessage,
  type RenewExpiredJwtRequestDto,
  unsupportedMagicLinkErrorMessage,
} from "./jwt.dto";

const jwtTextKindSchema = makeHardenedStringSchema({ max: 1000 });

export const renewExpiredJwtRequestSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtRequestDto> =
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("convention"),
      originalUrl: makeHardenedStringSchema({ max: 2000 }),
      expiredJwt: jwtTextKindSchema,
    }),
    z.object({
      kind: z.literal("connectedUser"),
      expiredJwt: jwtTextKindSchema,
    }),
    z.object({
      kind: z.literal("emailAuthCode"),
      expiredJwt: jwtTextKindSchema,
      state: zUuidLike,
    }),
  ]);

export const renewExpiredJwtResponseSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtResponse> =
  z.object({
    message: z
      .literal(expiredJwtErrorMessage)
      .or(z.literal(unsupportedMagicLinkErrorMessage)),
    needsNewMagicLink: z.boolean(),
  });
