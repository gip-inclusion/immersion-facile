import { Router } from "express";
import { frontRoutes, loginPeConnect, peConnect } from "../../../shared/routes";
import {
  PeConnectUserInfo,
  PoleEmploiConnect,
} from "../../secondary/immersionOffer/PoleEmploiConnect";
import { AppConfig } from "../appConfig";
import { AppDependencies } from "../config";
import { sendRedirectResponse } from "../helpers/sendHttpResponse";

export const createPeConnectRouter = (
  deps: AppDependencies,
  config: AppConfig,
) => {
  const peConnectRouter = Router({ mergeParams: true });

  // TODO Exploratory feature
  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponse(
      req,
      res,
      async (): Promise<string> => {
        const poleEmploiConnectIndividuGateway = new PoleEmploiConnect(
          config.poleEmploiAccessTokenConfig,
        );
        return poleEmploiConnectIndividuGateway.getAuthorizationCodeRedirectUrl();
      },
      deps.authChecker, //TODO Remove when behavior is validated
    ),
  );

  // TODO Exploratory feature
  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponse(req, res, async (): Promise<string> => {
      const poleEmploiConnectIndividu = new PoleEmploiConnect(
        config.poleEmploiAccessTokenConfig,
      );

      // Récupérer l'access token
      const accessTokenResponse =
        await poleEmploiConnectIndividu.getAccessToken(
          req.query.code as string,
        );

      //console.log(accessTokenResponse);
      // Récupérer les infos de l'utilisateur
      const userInfo: PeConnectUserInfo =
        await poleEmploiConnectIndividu.getUserInfo(
          accessTokenResponse.access_token,
        );

      // Retourner sur le formulaire avec la full querystring (rajouter champ hidden pour le sub )
      return `../${frontRoutes.immersionApplicationsRoute}?email=${encodeURI(
        userInfo.email,
      )}&firstName=${encodeURI(userInfo.family_name)}&lastName=${encodeURI(
        userInfo.given_name,
      )}&peExternalId=${encodeURI(userInfo.idIdentiteExterne)}`;
    }),
  );

  return peConnectRouter;
};
