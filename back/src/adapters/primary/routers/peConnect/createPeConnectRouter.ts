import { Router } from "express";
import {
  AbsoluteUrl,
  loginPeConnect,
  peConnect,
  queryParamsAsString,
} from "shared";
import { ExternalPeConnectOAuthGrantPayload } from "../../../secondary/PeConnectGateway/PeConnectApi";
import { AppConfig } from "../../config/appConfig";
import { AppDependencies } from "../../config/createAppDependencies";
import { FeatureDisabledError } from "../../helpers/httpErrors";
import { ManagedRedirectError } from "../../helpers/redirectErrors";
import { sendRedirectResponse } from "../../helpers/sendRedirectResponse";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponse(
      req,
      res,
      async () => {
        await throwIfPeConnectDisabled(deps);
        return routerMakeOauthGetAuthorizationCodeRedirectUrl(deps.config);
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponse(
      req,
      res,
      async () => {
        await throwIfPeConnectDisabled(deps);

        if (!req?.query?.code)
          throw new ManagedRedirectError("peConnectNoAuthorisation");

        return deps.useCases.linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          req.query.code as string,
        );
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  return peConnectRouter;
};

const throwIfPeConnectDisabled = async (deps: AppDependencies) => {
  const features = await deps.useCases.getFeatureFlags.execute();
  if (!features.enablePeConnectApi) {
    throw new FeatureDisabledError("PeConnect");
  }
};

const makeOauthGetAuthorizationCodeRedirectUrl = (
  peAuthCandidatUrl: AbsoluteUrl,
  authorizationCodePayload: ExternalPeConnectOAuthGrantPayload,
): AbsoluteUrl =>
  `${peAuthCandidatUrl}/connexion/oauth2/authorize?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
    authorizationCodePayload,
  )}`;
const peConnectNeededScopes = (clientId: string): string =>
  [
    `application_${clientId}`,
    "api_peconnect-individuv1",
    "api_peconnect-conseillersv1",
    "api_peconnect-statutv1",
    "individu",
    "openid",
    "profile",
    "email",
    "statut",
  ].join(" ");

function routerMakeOauthGetAuthorizationCodeRedirectUrl(
  appConfig: AppConfig,
): AbsoluteUrl {
  const authorizationCodePayload: ExternalPeConnectOAuthGrantPayload = {
    response_type: "code",
    client_id: appConfig.poleEmploiClientId,
    realm: "/individu",
    redirect_uri: `${appConfig.immersionFacileBaseUrl}/api/pe-connect`,
    scope: peConnectNeededScopes(appConfig.poleEmploiClientId),
  };

  return makeOauthGetAuthorizationCodeRedirectUrl(
    appConfig.peAuthCandidatUrl,
    authorizationCodePayload,
  );
}
