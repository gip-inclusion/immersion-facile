import { AccessTokenResponse, AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { createPeAxiosSharedClient } from "../config/helpers/createAxiosSharedClients";
import { HttpFranceTravailGateway } from "../domains/convention/adapters/pole-emploi-gateway/HttpFranceTravailGateway";
import { ResyncOldConventionsToPe } from "../domains/convention/use-cases/ResyncOldConventionsToPe";
import { InMemoryCachingGateway } from "../domains/core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const executeUsecase = async () => {
  const timeGateway = new RealTimeGateway();
  const peAxiosHttpClient = createPeAxiosSharedClient(config);

  const httpPoleEmploiGateway = new HttpFranceTravailGateway(
    peAxiosHttpClient,
    new InMemoryCachingGateway<AccessTokenResponse>(timeGateway, "expires_in"),
    config.peApiUrl,
    config.poleEmploiAccessTokenConfig,
    noRetries,
  );

  const { uowPerformer } = createUowPerformer(
    config,
    createGetPgPoolFn(config),
  );

  const resyncOldConventionsToPeUsecase = new ResyncOldConventionsToPe(
    uowPerformer,
    httpPoleEmploiGateway,
    timeGateway,
    config.maxConventionsToSyncWithPe,
  );

  return resyncOldConventionsToPeUsecase.execute();
};

handleCRONScript(
  "resyncOldConventionToPE",
  config,
  executeUsecase,
  (report) => {
    const errors = Object.entries(report.errors).map(
      ([key, error]) => `${key}: ${error.message} `,
    );

    const skips = Object.entries(report.skips).map(
      ([key, reason]) => `${key}: ${reason} `,
    );

    return [
      `Total of convention to sync : ${
        report.success + errors.length + skips.length
      }`,
      `Number of successfully sync convention : ${report.success}`,
      `Number of failures : ${errors.length}`,
      `Number of skips : ${skips.length}`,
      ...(errors.length > 0 ? [`Failures : ${errors.join("\n")}`] : []),
      ...(skips.length > 0 ? [`Skips : ${skips.join("\n")}`] : []),
    ].join("\n");
  },
  logger,
);
