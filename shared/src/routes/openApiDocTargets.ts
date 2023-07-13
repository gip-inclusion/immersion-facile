import { OpenAPIV3 } from "openapi-types";
import { createTarget, createTargets } from "http-client";

export type OpenApiDocTargets = typeof openApiDocTargets;
export const openApiDocTargets = createTargets({
  getOpenApiDoc: createTarget({
    method: "GET",
    url: "/v2-open-api-spec",
    validateResponseBody: (response) => response as OpenAPIV3.Document,
  }),
});
