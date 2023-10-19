import axios from "axios";
import { Pool } from "pg";
import { createAxiosSharedClient } from "shared-routes/axios";
import { GetAccessTokenResponse } from "../../../domain/convention/ports/PoleEmploiGateway";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/agencies/UpdateAllPeAgencies";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { HttpAddressGateway } from "../../secondary/addressGateway/HttpAddressGateway";
import { addressesExternalRoutes } from "../../secondary/addressGateway/HttpAddressGateway.routes";
import { ConsoleAppLogger } from "../../secondary/core/ConsoleAppLogger";
import { InMemoryCachingGateway } from "../../secondary/core/InMemoryCachingGateway";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
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
