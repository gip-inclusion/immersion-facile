import { Pool } from "pg";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/UpdateAllPeAgencies";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import {
  httpAddressApiClient,
  HttpAddressGateway,
} from "../../secondary/addressGateway/HttpAddressGateway";
import { ConsoleAppLogger } from "../../secondary/core/ConsoleAppLogger";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { HttpPeAgenciesReferential } from "../../secondary/immersionOffer/HttpPeAgenciesReferential";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";

const updateAllPeAgenciesScript = async () => {
  const config = AppConfig.createFromEnv();
  const accessTokenGateway = new PoleEmploiAccessTokenGateway(
    config.poleEmploiAccessTokenConfig,
    noRateLimit,
    noRetries,
  );

  const httpPeAgenciesReferential = new HttpPeAgenciesReferential(
    config.peApiUrl,
    accessTokenGateway,
    config.poleEmploiClientId,
  );

  const adressAPI = new HttpAddressGateway(httpAddressApiClient);

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const updateAllPeAgencies = new UpdateAllPeAgencies(
    uowPerformer,
    httpPeAgenciesReferential,
    adressAPI,
    config.defaultAdminEmail,
    new UuidV4Generator(),
    new ConsoleAppLogger(),
  );

  await updateAllPeAgencies.execute();
};

/* eslint-disable no-console */
updateAllPeAgenciesScript()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed with error : ", error);
    process.exit(1);
  });
