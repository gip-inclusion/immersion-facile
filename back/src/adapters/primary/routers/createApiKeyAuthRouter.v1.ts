import { Router } from "express";
import promClient from "prom-client";
import {
  addEstablishmentFormRouteWithApiKey,
  getImmersionOfferBySiretAndRomeRoute,
  searchImmersionRoute,
} from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../helpers/httpErrors";
import { pipeWithValue } from "../../../shared/pipeWithValue";
import { formEstablishmentSchema } from "../../../shared/formEstablishment/FormEstablishment.schema";
import { SiretAndRomeDto } from "../../../shared/siretAndRome/SiretAndRome.dto";

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
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              source: req.apiConsumer!.consumer,
            }),
        );
      });
    });

  publicV1Router.route(`/${searchImmersionRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
        req.body,
      );
      return deps.useCases.searchImmersion.execute(req.body, req.apiConsumer);
    }),
  );
  publicV1Router
    .route(`/${getImmersionOfferBySiretAndRomeRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
        return await deps.useCases.getImmersionOfferBySiretAndRome.execute(
          req.query as SiretAndRomeDto,
          req.apiConsumer,
        );
      }),
    );
  return publicV1Router;
};
