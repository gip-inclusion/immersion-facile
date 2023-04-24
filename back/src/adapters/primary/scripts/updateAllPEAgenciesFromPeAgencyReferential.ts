import { Pool } from "pg";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/agencies/UpdateAllPeAgencies";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { HttpAddressGateway } from "../../secondary/addressGateway/HttpAddressGateway";
import { addressesExternalTargets } from "../../secondary/addressGateway/HttpAddressGateway.targets";
import { ConsoleAppLogger } from "../../secondary/core/ConsoleAppLogger";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { HttpPeAgenciesReferential } from "../../secondary/immersionOffer/peAgenciesReferential/HttpPeAgenciesReferential";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "../config/appConfig";
import { createHttpClientForExternalApi } from "../config/createGateways";
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

  const adressAPI = new HttpAddressGateway(
    createHttpClientForExternalApi(addressesExternalTargets),
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
    adressAPI,
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
