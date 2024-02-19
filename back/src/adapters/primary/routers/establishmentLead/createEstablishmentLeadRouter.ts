import { Request, Router } from "express";
import { establishmentLeadRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

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
          req.payloads?.convention,
        ),
      ),
  );

  return establishmentLeadRouter;
};
