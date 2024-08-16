import { Email, ExternalId, emailSchema } from "shared";
import { z } from "zod";

export type OAuthIdTokenPayload = {
  nonce: string;
  sub: ExternalId;
  given_name: string;
  family_name: string;
  email: Email;
  structure_pe?: string;
};

export const oAuthIdTokenPayloadSchema: z.Schema<OAuthIdTokenPayload> =
  z.object({
    nonce: z.string(),
    sub: z.string(),
    given_name: z.string(),
    family_name: z.string(),
    email: emailSchema,
    structure_pe: z.string().optional(),
  });
