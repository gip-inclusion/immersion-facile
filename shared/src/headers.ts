import { z } from "zod";
import { zSchemaForType } from "./zodUtils";

export type Headers = { authorization: string };

export const withAuthorizationSchema = zSchemaForType<Headers>()(
  z.object({
    authorization: z.string(),
  }),
);

export const withValidateHeadersAuthorization = {
  validateHeaders: (headers: unknown) =>
    withAuthorizationSchema.passthrough().parse(headers),
  // passthrough is used to avoid stripping all other headers.
  // Authorization is needed but the rest of the headers will still be there at runtime.
  // Without passthrough, the rest of the headers would have been stripped.
};
