import { z } from "zod";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  FtConnectAdvisorForBeneficiary,
  FtConnectIdentity,
  FtConnectIdentityWithoutToken,
} from "./federatedIdentity.dto";

const ftConnectAdvisorPayloadSchema: ZodSchemaWithInputMatchingOutput<
  FtConnectAdvisorForBeneficiary | undefined
> = z
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

export const ftConnectIdentitySchema: ZodSchemaWithInputMatchingOutput<FtConnectIdentity> =
  z.object({
    provider: z.literal("ftConnect"),
    token: z.string(),
    payload: ftConnectAdvisorPayloadSchema,
  });

export const ftConnectIdentityWithoutTokenSchema: ZodSchemaWithInputMatchingOutput<FtConnectIdentityWithoutToken> =
  z.object({
    provider: z.literal("ftConnect"),
    payload: ftConnectAdvisorPayloadSchema,
  });
