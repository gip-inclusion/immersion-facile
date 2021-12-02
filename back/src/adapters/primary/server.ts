import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import {
  immersionApplicationSchema,
  listImmersionApplicationRequestDtoSchema,
} from "../../shared/ImmersionApplicationDto";
import { romeSearchRequestSchema } from "../../shared/rome";
import {
  agenciesRoute,
  generateMagicLinkRoute,
  getImmersionOfferByIdRoute as getImmersionOfferByIdRoute,
  immersionApplicationsRoute,
  immersionOffersRoute,
  renewMagicLinkRoute,
  romeRoute,
  searchImmersionRoute,
  siretRoute,
  validateDemandeRoute,
} from "../../shared/routes";
import { searchImmersionRequestSchema } from "../../shared/SearchImmersionDto";
import { getSiretRequestSchema } from "../../shared/siret";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "./appConfig";
import { createAppDependencies } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import { subscribeToEvents } from "./subscribeToEvents";
import expressPrometheusMiddleware = require("express-prometheus-middleware");

const logger = createLogger(__filename);

const metrics = expressPrometheusMiddleware({
  metricsPath: "/__metrics",
  collectDefaultMetrics: true,
});

export const createApp = async (config: AppConfig): Promise<Express> => {
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
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addDemandeImmersion.execute(req.body),
      ),
    )
    .get(async (req, res) => {
      sendHttpResponse(
        req,
        res,
        () =>
          callUseCase({
            useCase: deps.useCases.listDemandeImmersion,
            validationSchema: listImmersionApplicationRequestDtoSchema,
            useCaseParams: req.query,
          }),
        deps.authChecker,
      );
    });

  router.route(`/${validateDemandeRoute}/:id`).get(async (req, res) => {
    sendHttpResponse(
      req,
      res,
      () => deps.useCases.validateDemandeImmersion.execute(req.params.id),
      deps.authChecker,
    );
  });

  router.route(`/admin/${generateMagicLinkRoute}`).get(async (req, res) => {
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
    );
  });

  router.route(`/${renewMagicLinkRoute}`).get(async (req, res) => {
    sendHttpResponse(req, res, () =>
      deps.useCases.renewMagicLink.execute({
        applicationId: req.query.id,
        role: req.query.role,
        linkFormat: req.query.linkFormat,
      } as any),
    );
  });

  const demandeImmersionRouter = Router({ mergeParams: true });
  router.use(`/admin`, demandeImmersionRouter);

  demandeImmersionRouter
    .route(`/${immersionApplicationsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getDemandeImmersion.execute(req.params),
        deps.authChecker,
      ),
    );

  router
    .route(`/${immersionOffersRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  router.route(`/${searchImmersionRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: deps.useCases.searchImmersion,
        validationSchema: searchImmersionRequestSchema,
        useCaseParams: req.body,
      }),
    ),
  );

  router
    .route(`/${getImmersionOfferByIdRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getImmersionOfferById.execute(req.params.id),
      ),
    );

  router.route(`/${romeRoute}`).get(async (req, res) => {
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return callUseCase({
        useCase: deps.useCases.romeSearch,
        validationSchema: romeSearchRequestSchema,
        useCaseParams: req.query.searchText,
      });
    });
  });

  router.route(`/${siretRoute}/:siret`).get(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      callUseCase({
        useCase: deps.useCases.getSiret,
        validationSchema: getSiretRequestSchema,
        useCaseParams: req.params,
      }),
    ),
  );

  router.route(`/${immersionApplicationsRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: deps.useCases.addDemandeImmersionML,
        validationSchema: immersionApplicationSchema,
        useCaseParams: req.body,
      }),
    ),
  );

  router
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => deps.useCases.listAgencies.execute()),
    );

  app.use(router);
  app.use("/auth", createMagicLinkRouter(deps));

  subscribeToEvents(deps);

  deps.eventCrawler.startCrawler();

  return app;
};
