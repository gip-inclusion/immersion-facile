import { z } from "zod";
import { zStringCanBeEmpty } from "../zodUtils";
import { BackOfficeJwt } from "./jwt.dto";
import { BackOfficeJwtPayload, CommonJwtPayload } from "./jwtPayload.dto";

export const appJwtPayloadSchema: z.Schema<CommonJwtPayload> = z.object({
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

export const backOfficeJwtSchema: z.Schema<BackOfficeJwt> = z.string();
