import { Router } from "express";
import { contactEstablishmentRoute, pipeWithValue } from "shared";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { contactEstablishmentPublicV2ToDomain } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV2 = (deps: AppDependencies) => {
  const publicV2Router = Router({ mergeParams: true });

  publicV2Router.use(deps.apiKeyAuthMiddleware);

  publicV2Router.route(`/${contactEstablishmentRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
      return pipeWithValue(
        validateAndParseZodSchema(
          contactEstablishmentPublicV2Schema,
          req.body,
          logger,
        ),
        contactEstablishmentPublicV2ToDomain,
        (contactRequest) =>
          deps.useCases.contactEstablishment.execute(contactRequest),
      );
    }),
  );

  return publicV2Router;
};
