import { Router } from "express";
import { loginPeConnect, peConnect } from "../../../shared/routes";
import { AppConfig } from "../appConfig";
import { AppDependencies } from "../config";
import { sendRedirectResponse } from "../helpers/sendHttpResponse";

export const createPeConnectRouter = (
  deps: AppDependencies,
  _config: AppConfig,
) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponse(req, res, async (): Promise<string> => {
      return deps.repositories.peConnectGateway.oAuthGetAuthorizationCodeRedirectUrl();
    }),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponse(req, res, async (): Promise<string> => {
      return deps.useCases.linkUserPeConnectAccount.execute(
        req.query.code as string,
      );
    }),
  );

  return peConnectRouter;
};
