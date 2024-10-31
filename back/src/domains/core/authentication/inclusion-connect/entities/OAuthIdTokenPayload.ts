import { Email, ExternalId, emailSchema } from "shared";
import { z } from "zod";

type ProviderTokenPayloadBase = {
  sub: ExternalId;
  given_name: string;
  email: Email;
  structure_pe?: string;
};

export type IcOAuthIdTokenPayload = ProviderTokenPayloadBase & {
  nonce: string;
  family_name: string;
};

export type ProConnectOAuthIdTokenPayload = ProviderTokenPayloadBase & {
  usual_name: string;
  custom: {
    structureTravail?: string;
  };
};

export const icAuthTokenPayloadSchema: z.Schema<IcOAuthIdTokenPayload> =
  z.object({
    nonce: z.string(),
    sub: z.string(),
    given_name: z.string(),
    family_name: z.string(),
    email: emailSchema,
    structure_pe: z.string().optional(),
  });

export const proConnectAuthTokenPayloadSchema: z.Schema<ProConnectOAuthIdTokenPayload> =
  z.object({
    sub: z.string(),
    given_name: z.string(),
    usual_name: z.string(),
    email: emailSchema,
    custom: z.object({
      structureTravail: z.string().optional(),
    }),
  });
