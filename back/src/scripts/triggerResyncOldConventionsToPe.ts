import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeConnectedRedisClient } from "../config/bootstrap/cache";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { createFranceTravailRoutes } from "../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../domains/convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { ResyncOldConventionsToFt } from "../domains/convention/use-cases/ResyncOldConventionsToFt";
import { makeRedisWithCache } from "../domains/core/caching-gateway/adapters/makeRedisWithCache";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { makeAxiosInstances } from "../utils/axiosUtils";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const executeUsecase = async () => {
  const redisClient = await makeConnectedRedisClient(config);
  const timeGateway = new RealTimeGateway();

  const withCache = makeRedisWithCache({
    defaultCacheDurationInHours: 1,
    redisClient,
  });

  const franceTravailRoutes = createFranceTravailRoutes({
    ftApiUrl: config.ftApiUrl,
    ftEnterpriseUrl: config.ftEnterpriseUrl,
  });

  const httpFranceTravailGateway = new HttpFranceTravailGateway(
    createAxiosSharedClient(
      franceTravailRoutes,
      makeAxiosInstances(config.externalAxiosTimeoutForFranceTravail)
        .axiosWithValidateStatus,
    ),
    withCache,
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
    franceTravailRoutes,
  );

  const { uowPerformer } = createUowPerformer(
    config,
    createMakeProductionPgPool(config),
  );

  const resyncOldConventionsToFtUsecase = new ResyncOldConventionsToFt(
    uowPerformer,
    httpFranceTravailGateway,
    timeGateway,
    config.maxConventionsToSyncWithPe,
  );

  const result = await resyncOldConventionsToFtUsecase.execute();
  await redisClient.disconnect();

  return result;
};

handleCRONScript({
  name: "resyncOldConventionToFT",
  config,
  script: executeUsecase,
  handleResults: (report) => {
    const errors = Object.entries(report.errors).map(
      ([key, error]) => `${key}: ${error.message} `,
    );

    const skips = Object.entries(report.skips).map(
      ([key, reason]) => `${key}: ${reason} `,
    );

    return [
      `Total of convention to sync : ${report.success + errors.length + skips.length}`,
      `Number of successfully sync convention : ${report.success}`,
      `Number of failures : ${errors.length}`,
      `Number of skips : ${skips.length}`,
      ...(errors.length > 0 ? [`Failures : ${errors.join("\n")}`] : []),
      ...(skips.length > 0 ? [`Skips : ${skips.join("\n")}`] : []),
    ].join("\n");
  },
  logger,
});
