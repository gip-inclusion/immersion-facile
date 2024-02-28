import axios from "axios";
import { Pool } from "pg";
import { createAxiosSharedClient } from "shared-routes/axios";
import { GetAccessTokenResponse } from "../../../domains/convention/ports/PoleEmploiGateway";
import { UpdateAllPeAgencies } from "../../../domains/convention/useCases/agencies/UpdateAllPeAgencies";
import { HttpAddressGateway } from "../../../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../../../domains/core/address/adapters/HttpAddressGateway.routes";
import { ConsoleAppLogger } from "../../../domains/core/app-logger/adapters/ConsoleAppLogger";
import { noRetries } from "../../../domains/core/ports/RetryStrategy";
import { RealTimeGateway } from "../../../domains/core/time-gateway/adapters/RealTimeGateway";
import { UuidV4Generator } from "../../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryCachingGateway } from "../../secondary/core/InMemoryCachingGateway";
import { HttpPeAgenciesReferential } from "../../secondary/offer/peAgenciesReferential/HttpPeAgenciesReferential";
import { HttpPoleEmploiGateway } from "../../secondary/poleEmploi/HttpPoleEmploiGateway";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";
import { createPeAxiosSharedClient } from "../helpers/createAxiosSharedClients";

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
