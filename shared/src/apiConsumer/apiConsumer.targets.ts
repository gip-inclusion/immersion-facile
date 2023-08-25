import { createTarget, createTargets } from "http-client";
import { withValidateHeadersAuthorization } from "../headers";
import { jwtSchema } from "../tokens/jwt.schema";
import { apiConsumerSchema } from "./ApiConsumer.schema";

export type ApiConsumerTargets = typeof apiConsumerTargets;

export const apiConsumerTargets = createTargets({
  saveApiConsumer: createTarget({
    method: "POST",
    url: `/apiConsumers`,
    ...withValidateHeadersAuthorization,
    validateRequestBody: apiConsumerSchema.parse,
    validateResponseBody: jwtSchema.parse,
  }),
});
