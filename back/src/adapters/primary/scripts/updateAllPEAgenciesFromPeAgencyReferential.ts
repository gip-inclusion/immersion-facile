import { Pool } from "pg";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { UpdateAllPeAgencies } from "../../../domain/immersionApplication/useCases/UpdateAllPeAgencies";
import { ConsoleAppLogger } from "../../secondary/core/ConsoleAppLogger";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { HttpPeAgenciesReferential } from "../../secondary/immersionOffer/HttpPeAgenciesReferential";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { AppConfig } from "../config/appConfig";

const updateAllPeAgenciesScript = async () => {
  const config = AppConfig.createFromEnv();
  const accessTokenGateway = new PoleEmploiAccessTokenGateway(
    config.poleEmploiAccessTokenConfig,
    noRateLimit,
    noRetries,
  );

  const httpPeAgenciesReferential = new HttpPeAgenciesReferential(
    accessTokenGateway,
    config.poleEmploiClientId,
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();
  const agencyRepository = new PgAgencyRepository(client);

  const updateAllPeAgencies = new UpdateAllPeAgencies(
    httpPeAgenciesReferential,
    agencyRepository,
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
