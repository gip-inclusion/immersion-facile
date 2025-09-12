import { httpErrorSchema, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { contactEstablishmentPublicV3Schema } from "../DtoAndSchemas/v3/input/ContactEstablishmentPublicV3.schema";

export type PublicApiV3SearchEstablishmentRoutes =
  typeof publicApiV3SearchEstablishmentRoutes;

const versionPrefix = "v3";

export const publicApiV3SearchEstablishmentRoutes = defineRoutes({
  contactEstablishment: defineRoute({
    method: "post",
    url: `/${versionPrefix}/contact-establishment`,
    requestBodySchema: contactEstablishmentPublicV3Schema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});
