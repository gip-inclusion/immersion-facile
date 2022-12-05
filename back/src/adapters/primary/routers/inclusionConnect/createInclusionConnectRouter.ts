import { Request, Response, Router } from "express";
import { AbsoluteUrl, inclusionConnectImmersionTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

const sendRedirectResponse = async (
  _req: Request,
  res: Response,
  callback: () => Promise<AbsoluteUrl>,
) => {
  const redirectUrl = await callback();
  res.status(302);
  return res.redirect(redirectUrl);
};

export const createInclusionConnectRouter = (deps: AppDependencies) => {
  const inclusionConnectRouter = Router({ mergeParams: true });

  inclusionConnectRouter
    .route(inclusionConnectImmersionTargets.startInclusionConnectLogin.url)
    .get(async (req, res) =>
      // eslint-disable-next-line @typescript-eslint/require-await
      sendRedirectResponse(req, res, async () =>
        deps.useCases.initiateInclusionConnect.execute(),
      ),
    );

  inclusionConnectRouter
    .route(inclusionConnectImmersionTargets.afterLoginRedirection.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.authenticateWithInclusionCode.execute(req.query as any),
      ),
    );

  return inclusionConnectRouter;
};
