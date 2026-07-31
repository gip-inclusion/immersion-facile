import { z } from "zod";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  FtConnectIdentity,
  FtConnectIdentityWithoutToken,
} from "./federatedIdentity.dto";

const ftConnectAdvisorPayloadSchema = z
  .object({
    advisor: z
      .object({
        email: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        type: z.enum(["PLACEMENT", "CAPEMPLOI", "INDEMNISATION"], {
          error: localization.invalidEnum,
        }),
      })
      .optional(),
  })
  .optional();

export const peConnectIdentitySchema: ZodSchemaWithInputMatchingOutput<FtConnectIdentity> =
  z.object({
    provider: z.literal("peConnect"),
    token: z.string(),
    payload: ftConnectAdvisorPayloadSchema,
  });

export const peConnectIdentityWithoutTokenSchema: ZodSchemaWithInputMatchingOutput<FtConnectIdentityWithoutToken> =
  z.object({
    provider: z.literal("peConnect"),
    payload: ftConnectAdvisorPayloadSchema,
  });
