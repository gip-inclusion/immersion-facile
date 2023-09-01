import { defineRoute, defineRoutes } from "shared-routes";
import { withAuthorizationHeaders } from "../headers";
import { legacyUnauthenticatedErrorSchema } from "../httpClient/errors/httpErrors.schema";
import { jwtSchema } from "../tokens/jwt.schema";
import { apiConsumerSchema } from "./ApiConsumer.schema";

export type ApiConsumerRoutes = typeof apiConsumerRoutes;

export const apiConsumerRoutes = defineRoutes({
  saveApiConsumer: defineRoute({
    method: "post",
    url: `/api-consumers`,
    requestBodySchema: apiConsumerSchema,
    ...withAuthorizationHeaders,
    responses: { 200: jwtSchema, 401: legacyUnauthenticatedErrorSchema },
  }),
});
