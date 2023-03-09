import { z } from "zod";
import { zStringCanBeEmpty } from "../zodUtils";
import { AppJwtPayload, BackOfficeJwtPayload, JwtDto } from "./token.dto";

export const jwtSchema: z.Schema<JwtDto> = z.object({ jwt: z.string() });

export const appJwtPayloadSchema: z.Schema<AppJwtPayload> = z.object({
  iat: z.number(),
  exp: z.number().optional(),
  version: z.number(),
});

export const backOfficeJwtPayloadSchema: z.Schema<BackOfficeJwtPayload> =
  appJwtPayloadSchema.and(
    z.object({
      sub: zStringCanBeEmpty,
      role: z.literal("backOffice"),
    }),
  );
