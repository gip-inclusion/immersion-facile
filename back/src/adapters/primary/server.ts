import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import {
  agenciesRoute,
  contactEstablishmentRoute,
  exportEstablismentsExcelRoute,
  exportImmersionApplicationsExcelRoute,
  formAlreadyExistsRoute,
  frontRoutes,
  generateMagicLinkRoute,
  getFeatureFlags,
  immersionApplicationShareRoute,
  immersionApplicationsRoute,
  immersionOffersFromFrontRoute,
  loginPeConnect,
  peConnect,
  renewMagicLinkRoute,
  requestEmailToUpdateFormRoute,
  romeRoute,
  siretRoute,
  validateImmersionApplicationRoute,
} from "../../shared/routes";
import { temporaryStoragePath } from "../../utils/filesystemUtils";
import { createLogger } from "../../utils/logger";
import {
  PeConnectUserInfo,
  PoleEmploiConnect,
} from "../secondary/immersionOffer/PoleEmploiConnect";
import { createApiKeyAuthRouter } from "./ApiKeyAuthRouter";
import { AppConfig } from "./appConfig";
import { createAppDependencies, Repositories } from "./config";
import {
  sendHttpResponse,
  sendRedirectResponse,
  sendZipResponse,
} from "./helpers/sendHttpResponse";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import { subscribeToEvents } from "./subscribeToEvents";
import expressPrometheusMiddleware = require("express-prometheus-middleware");
import { GenerateApiConsumerJtw } from "../../domain/auth/jwt";
import { capitalize } from "../../shared/utils/string";

const logger = createLogger(__filename);

const metrics = expressPrometheusMiddleware({
  metricsPath: "/__metrics",
  collectDefaultMetrics: true,
});

export const createApp = async (
  config: AppConfig,
): Promise<{
  app: Express;
  repositories: Repositories;
  eventCrawler: EventCrawler;
  generateApiJwt: GenerateApiConsumerJtw;
}> => {
  const app = express();
  const router = Router();
  app.use(PinoHttp({ logger }));

  app.use(metrics);

  app.use(bodyParser.json());

  router.route("/").get((req, res) => {
    return res.json({ message: "Hello World !" });
  });

  const deps = await createAppDependencies(config);

  router
    .route(`/${exportImmersionApplicationsExcelRoute}`)
    .get(async (req, res) => {
      sendZipResponse(
        req,
        res,
        async () => {
          const archivePath = temporaryStoragePath("exportAgencies.zip");
          await deps.useCases.exportImmersionApplicationsAsExcelArchive.execute(
            archivePath,
          );
          return archivePath;
        },
        deps.authChecker,
      );
    });

  router.route(`/${exportEstablismentsExcelRoute}`).get(async (req, res) => {
    sendZipResponse(
      req,
      res,
      async () => {
        const groupBy =
          req.query.groupBy === "region" ? "region" : "department";
        const aggregateProfession = req.query.aggregateProfession === "true";
        const archivePath = temporaryStoragePath(
          `exportEstablishmentsBy${capitalize(groupBy)}${
            aggregateProfession ? "AggregatedProfessions" : ""
          }.zip`,
        );

        await deps.useCases.exportEstablishmentsAsExcelArchive.execute({
          archivePath,
          groupBy,
          aggregateProfession,
        });

        return archivePath;
      },
      deps.authChecker,
    );
  });

  router
    .route(`/${immersionApplicationShareRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.shareApplicationByEmail.execute(req.body),
      ),
    );

  router
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addImmersionApplication.execute(req.body),
      ),
    )
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.listImmersionApplication.execute(req.query),
        deps.authChecker,
      ),
    );

  router
    .route(`/${validateImmersionApplicationRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.validateImmersionApplication.execute(req.params.id),
        deps.authChecker,
      ),
    );

  router.route(`/admin/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.generateMagicLink.execute({
          applicationId: req.query.id,
          role: req.query.role,
          expired: req.query.expired === "true",
        } as any),
      deps.authChecker,
    ),
  );

  router.route(`/${renewMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewMagicLink.execute({
        expiredJwt: req.query.expiredJwt,
        linkFormat: req.query.linkFormat,
      } as any),
    ),
  );

  const immersionApplicationRouter = Router({ mergeParams: true });
  router.use(`/admin`, immersionApplicationRouter);

  immersionApplicationRouter
    .route(`/${immersionApplicationsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getImmersionApplication.execute(req.params),
        deps.authChecker,
      ),
    );

  router
    .route(`/${contactEstablishmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );

  router.route(`/${romeRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return deps.useCases.romeSearch.execute(req.query.searchText as any);
    }),
  );

  router
    .route(`/${siretRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getSiret.execute(req.params),
      ),
    );

  router
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.listAgencies.execute({
          position: {
            lat: parseFloat(req.query.lat as any),
            lon: parseFloat(req.query.lon as any),
          } as any,
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addAgency.execute(req.body),
      ),
    );

  router.route(`/${formAlreadyExistsRoute}/:siret`).get(async (req, res) => {
    console.log(
      "in route formAlreadyExistsRoute with siret ",
      req.params.siret,
    );
    return sendHttpResponse(req, res, async () =>
      deps.repositories.immersionOffer.hasEstablishmentFromFormWithSiret(
        req.params.siret,
      ),
    );
  });

  router
    .route(`/${requestEmailToUpdateFormRoute}/:siret`)
    .get(async (req, res) => {
      return sendHttpResponse(req, res, async () =>
        deps.useCases.requestEditFormEstablishment.execute(req.params.siret),
      );
    });

  router
    .route(`/${getFeatureFlags}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.repositories.getFeatureFlags),
    );

  router
    .route(`/${immersionOffersFromFrontRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  // TODO Exploratory feature
  router.route(`/${loginPeConnect}`).get(async (req, res) =>
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
  router.route(`/${peConnect}`).get(async (req, res) =>
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

  app.use(router);
  app.use("/auth", createMagicLinkRouter(deps));
  app.use(createApiKeyAuthRouter(deps));

  subscribeToEvents(deps);

  deps.eventCrawler.startCrawler();

  return {
    app,
    repositories: deps.repositories,
    eventCrawler: deps.eventCrawler,
    generateApiJwt: deps.generateApiJwt,
  };
};
