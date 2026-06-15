import { Router } from "express";
import { establishmentLeadRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getGenericAuthOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createEstablishmentLeadRouter = (deps: AppDependencies) => {
  const establishmentLeadRouter = Router({ mergeParams: true });

  const establishmentLeadSharedRouter = createExpressSharedRouter(
    establishmentLeadRoutes,
    establishmentLeadRouter,
  );

  establishmentLeadSharedRouter.unregisterEstablishmentLead(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res.status(204), () =>
        deps.useCases.markEstablishmentLeadAsRegistrationRejected.execute(
          undefined,
          getGenericAuthOrThrow(req.payloads?.convention),
        ),
      ),
  );

  return establishmentLeadRouter;
};
