import { Router } from "express";
import { authRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../../../config/helpers/sendRedirectResponse";
import { getGenericAuthOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createAuthRouter = (deps: AppDependencies) => {
  const router = Router({ mergeParams: true });

  const authSharedRouter = createExpressSharedRouter(authRoutes, router);

  authSharedRouter.initiateLoginByOAuth((req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.initiateLoginByOAuth.execute(req.query),
    ),
  );

  authSharedRouter.afterOAuthSuccessRedirection((req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.afterOAuthSuccessRedirection.execute(req.query),
    ),
  );

  authSharedRouter.initiateLoginByEmail((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.initiateLoginByEmail.execute(req.body),
    ),
  );

  authSharedRouter.getConnectedUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConnectedUser.execute(
          req.query,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authSharedRouter.getOAuthLogoutUrl(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getOAuthLogoutUrl.execute(
          req.query,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return router;
};
