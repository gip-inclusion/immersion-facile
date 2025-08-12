import { z } from "zod";

export type WithAuthorizationHeader = { authorization: string };

const withAuthorizationSchema: z.Schema<WithAuthorizationHeader> = z
  .object({
    authorization: z.string(),
  })
  .loose();

export const withValidateHeadersAuthorization = {
  validateHeaders: (headers: unknown) => withAuthorizationSchema.parse(headers),
};

export const withAuthorizationHeaders = {
  headersSchema: withAuthorizationSchema,
};
