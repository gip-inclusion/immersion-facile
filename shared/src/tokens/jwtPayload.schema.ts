import { z } from "zod";
import { BackOfficeJwt } from "./jwt.dto";
import { CommonJwtPayload } from "./jwtPayload.dto";

export const appJwtPayloadSchema: z.Schema<CommonJwtPayload> = z.object({
  iat: z.number(),
  exp: z.number().optional(),
  version: z.number(),
});

export const backOfficeJwtSchema: z.Schema<BackOfficeJwt> = z.string();
