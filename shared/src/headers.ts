import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "./zodUtils";

export type WithAuthorizationHeader = { authorization: string };

const withAuthorizationSchema: ZodSchemaWithInputMatchingOutput<WithAuthorizationHeader> =
  z.looseObject({
    authorization: z.string(),
  });

export const withValidateHeadersAuthorization = {
  validateHeaders: (headers: unknown) => withAuthorizationSchema.parse(headers),
};

export const withAuthorizationHeaders = {
  headersSchema: withAuthorizationSchema,
};
