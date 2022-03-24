import { Router } from "express";
import promClient from "prom-client";
import { addEstablishmentFormRouteWithApiKey } from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../helpers/httpErrors";
import { pipeWithValue } from "../../../shared/pipeWithValue";
import { formEstablishmentSchema } from "../../../shared/formEstablishment/FormEstablishment.schema";

const counterFormEstablishmentCaller = new promClient.Counter({
  name: "form_establishment_v1_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

export const createApiKeyAuthRouterV1 = (deps: AppDependencies) => {
  const publicV1Router = Router({ mergeParams: true });

  publicV1Router.use(deps.apiKeyAuthMiddleware);

  publicV1Router
    .route(`/${addEstablishmentFormRouteWithApiKey}`)
    .post(async (req, res) => {
      counterFormEstablishmentCaller.inc({
        referer: req.get("Referrer"),
      });
      return sendHttpResponse(req, res, () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();

        return pipeWithValue(
          validateAndParseZodSchema(formEstablishmentSchema, req.body),
          (domainFormEstablishmentWithoutSource) =>
            deps.useCases.addFormEstablishment.execute({
              ...domainFormEstablishmentWithoutSource,
              source: req.apiConsumer!.consumer,
            }),
        );
      });
    });

  return publicV1Router;
};
