import z from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { RenewExpiredJwtRequestDto } from "./jwt.dto";

const expiredConventionJwtRenewParams = z.object({
  originalUrl: z.string(),
  expiredJwt: z.string(),
});

const expiredConnectedUserJwtRenewParams = z.object({
  expiredJwt: z.string(),
});

const expiredEmailAuthCodeJwtRenewParams = z.object({
  expiredJwt: z.string(),
  state: z.string(),
});

export const renewExpiredJwtRequestSchema: ZodSchemaWithInputMatchingOutput<RenewExpiredJwtRequestDto> =
  z.union([
    expiredConventionJwtRenewParams,
    expiredConnectedUserJwtRenewParams,
    expiredEmailAuthCodeJwtRenewParams,
  ]);
