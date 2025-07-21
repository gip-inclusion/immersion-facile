import { Router } from "express";
import { authRoutes, errors } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../../../config/helpers/sendRedirectResponse";
import { getCurrentUserOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createAuthRouter = (deps: AppDependencies) => {
  const router = Router({ mergeParams: true });

  const authSharedRouter = createExpressSharedRouter(authRoutes, router);

  authSharedRouter.initiateLoginByOAuth((req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.initiateLoginByOAuth.execute(req.query),
    ),
  );

  authSharedRouter.afterOAuthSuccessRedirection(async (req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.afterOAuthSuccessRedirection.execute(req.query),
    ),
  );

  authSharedRouter.initiateLoginByEmail(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.initiateLoginByEmail.execute(req.body),
    ),
  );

  authSharedRouter.getConnectedUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getConnectedUser.execute(
          req.query,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authSharedRouter.getOAuthLogoutUrl(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getOAuthLogoutUrl.execute(
          { idToken: req.query.idToken },
          currentUser,
        );
      }),
  );

  return router;
};
