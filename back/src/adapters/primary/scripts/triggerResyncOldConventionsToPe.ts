import { Pool } from "pg";
import { GetAccessTokenResponse } from "../../../domains/convention/ports/PoleEmploiGateway";
import { ResyncOldConventionsToPe } from "../../../domains/convention/useCases/ResyncOldConventionsToPe";
import { noRetries } from "../../../domains/core/ports/RetryStrategy";
import { RealTimeGateway } from "../../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../../../domains/core/unit-of-work/adapters/createUowPerformer";
import { createLogger } from "../../../utils/logger";
import { InMemoryCachingGateway } from "../../secondary/core/InMemoryCachingGateway";
import { HttpPoleEmploiGateway } from "../../secondary/poleEmploi/HttpPoleEmploiGateway";
import { AppConfig } from "../config/appConfig";
import { createPeAxiosSharedClient } from "../helpers/createAxiosSharedClients";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const executeUsecase = async () => {
  const timeGateway = new RealTimeGateway();
  const peAxiosHttpClient = createPeAxiosSharedClient(config);

  const httpPoleEmploiGateway = new HttpPoleEmploiGateway(
    peAxiosHttpClient,
    new InMemoryCachingGateway<GetAccessTokenResponse>(
      timeGateway,
      "expires_in",
    ),
    config.peApiUrl,
    config.poleEmploiAccessTokenConfig,
    noRetries,
  );

  const { uowPerformer } = createUowPerformer(
    config,
    () =>
      new Pool({
        connectionString: config.pgImmersionDbUrl,
      }),
  );

  const resyncOldConventionsToPeUsecase = new ResyncOldConventionsToPe(
    uowPerformer,
    httpPoleEmploiGateway,
    timeGateway,
    config.maxConventionsToSyncWithPe,
  );

  return resyncOldConventionsToPeUsecase.execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
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
