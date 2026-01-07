import z from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { RenewExpiredJwtRequestDto } from "./jwt.dto";

export const renewExpiredJwtRequestSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtRequestDto> =
  z.object({
    originalUrl: z.string(),
    expiredJwt: z.string(),
  });
