import { Router } from "express";
import {
  type ApiConsumer,
  errors,
  isApiConsumerAllowed,
  pipeWithValue,
  type WithAcquisition,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { validateAndParseZodSchema } from "../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../utils/logger";
import { contactEstablishmentPublicV3ToDomain } from "../DtoAndSchemas/v3/input/ContactEstablishmentPublicV3.dto";
import { contactEstablishmentPublicV3Schema } from "../DtoAndSchemas/v3/input/ContactEstablishmentPublicV3.schema";
import { publicApiV3SearchEstablishmentRoutes } from "./publicApiV3.routes";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV3 = (deps: AppDependencies) => {
  const v3ExpressRouter = Router({ mergeParams: true });

  const searchEstablishmentV3Router = createExpressSharedRouter(
    publicApiV3SearchEstablishmentRoutes,
    v3ExpressRouter,
  );

  searchEstablishmentV3Router.contactEstablishment(
    deps.apiConsumerMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () => {
        if (
          !isApiConsumerAllowed({
            apiConsumer: req.apiConsumer,
            rightName: "searchEstablishment",
            consumerKind: "READ",
          })
        )
          throw errors.apiConsumer.forbidden();
        return pipeWithValue(
          validateAndParseZodSchema({
            schemaName: "contactEstablishmentPublicV3Schema",
            inputSchema: contactEstablishmentPublicV3Schema,
            schemaParsingInput: req.body,
            logger,
          }),
          contactEstablishmentPublicV3ToDomain,
          (contactRequest) =>
            deps.useCases.contactEstablishment.execute(
              addAcquisitionParams(contactRequest, req.apiConsumer),
            ),
        );
      }),
  );
  return v3ExpressRouter;
};

const addAcquisitionParams = <T>(
  obj: T,
  apiConsumer: ApiConsumer | undefined,
): T & WithAcquisition => ({
  ...obj,
  ...(apiConsumer
    ? {
        acquisitionCampaign: "api-consumer",
        acquisitionKeyword: `${apiConsumer.id} - ${apiConsumer.name}`,
      }
    : {}),
});
