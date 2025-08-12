import {
  type Email,
  type ExternalId,
  emailSchema,
  type SiretDto,
  siretSchema,
} from "shared";
import { z } from "zod/v4";

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
  siret: SiretDto;
  custom: {
    structureTravail?: string;
  };
};

export const proConnectAuthTokenPayloadSchema: z.Schema<ProConnectOAuthIdTokenPayload> =
  z.object({
    sub: z.string(),
    given_name: z.string(),
    usual_name: z.string(),
    email: emailSchema,
    custom: z.object({
      structureTravail: z.string().optional(),
    }),
    siret: siretSchema,
  });
