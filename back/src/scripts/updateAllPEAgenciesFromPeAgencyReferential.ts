import axios from "axios";
import { Pool } from "pg";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../config/helpers/createAxiosSharedClients";
import { HttpPeAgenciesReferential } from "../domains/agency/adapters/pe-agencies-referential/HttpPeAgenciesReferential";
import { UpdateAllPeAgencies } from "../domains/agency/use-cases/UpdateAllPeAgencies";
import { HttpPoleEmploiGateway } from "../domains/convention/adapters/pole-emploi-gateway/HttpPoleEmploiGateway";
import { GetAccessTokenResponse } from "../domains/convention/ports/PoleEmploiGateway";
import { HttpAddressGateway } from "../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../domains/core/address/adapters/HttpAddressGateway.routes";
import { ConsoleAppLogger } from "../domains/core/app-logger/adapters/ConsoleAppLogger";
import { InMemoryCachingGateway } from "../domains/core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";

const updateAllPeAgenciesScript = async () => {
  const config = AppConfig.createFromEnv();
  const axiosInstance = axios.create({ timeout: config.externalAxiosTimeout });
  const peAxiosHttpClient = createPeAxiosSharedClient(config, axiosInstance);

  const httpPeAgenciesReferential = new HttpPeAgenciesReferential(
    config.peApiUrl,
    new HttpPoleEmploiGateway(
      peAxiosHttpClient,
      new InMemoryCachingGateway<GetAccessTokenResponse>(
        new RealTimeGateway(),
        "expires_in",
      ),
      config.peApiUrl,
      config.poleEmploiAccessTokenConfig,
      noRetries,
    ),
    config.poleEmploiClientId,
  );

  const addressGateway = new HttpAddressGateway(
    createAxiosSharedClient(addressesExternalRoutes, axiosInstance),
    config.apiKeyOpenCageDataGeocoding,
    config.apiKeyOpenCageDataGeosearch,
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const updateAllPeAgencies = new UpdateAllPeAgencies(
    uowPerformer,
    httpPeAgenciesReferential,
    addressGateway,
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
