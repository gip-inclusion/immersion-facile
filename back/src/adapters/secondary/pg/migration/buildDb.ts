import fs from "fs";
import { Pool, PoolClient } from "pg";
import { promisify } from "util";
import { AgencyConfig } from "../../../../domain/immersionApplication/ports/AgencyRepository";
import { sleep } from "../../../../shared/utils";
import { createLogger } from "../../../../utils/logger";
import { AppConfig } from "../../../primary/appConfig";
import { createAgencyConfigsFromAppConfig } from "../../InMemoryAgencyRepository";
import { PgAgencyRepository } from "../PgAgencyRepository";

const logger = createLogger(__filename);

const readFile = promisify(fs.readFile);

const tryToConnect = async (
  connectionString: string,
  tryNumber = 0,
): Promise<PoolClient> => {
  if (tryNumber >= 5)
    throw new Error("Tried to connect 5 times without success");
  try {
    logger.info("Trying to connect to DB ...");
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    logger.info("Successfully connected");
    return client;
  } catch (e: any) {
    const newTryNumber = tryNumber + 1;
    logger.error(
      `Could not connect to DB (error: ${e.message}). Try number: ${newTryNumber}, will try again in 15s`,
    );
    await sleep(15000);
    return await tryToConnect(connectionString, newTryNumber);
  }
};

const buildDb = async () => {
  // It should be the same AppConfig than the one in startServer.ts
  const appConfig = AppConfig.createFromEnv();
  const providedPgUrl = process.argv[2];

  // during CI we don't have repositories set in config, but we provide a PG_URL, that's why we need the extra check below
  if (appConfig.repositories !== "PG" && !providedPgUrl) {
    logger.info(
      `Repositories are ${process.env.REPOSITORIES}, so the Postgres buildDb script won't be run`,
    );
    return;
  }

  const pgUrl = providedPgUrl ?? appConfig.pgImmersionDbUrl;
  if (!pgUrl) throw new Error("Please provide PG url");
  logger.info(`Starting build db script for db url : ${pgUrl} -- end`);

  const client = await tryToConnect(pgUrl);
  const checkIfTableExists = makeCheckIfTableAlreadyExists(client);

  // prettier-ignore
  const immersionOffersTableAlreadyExists = await checkIfTableExists("immersion_offers");
  if (!immersionOffersTableAlreadyExists) {
    logger.info("We will thus construct the database");
    await buildSearchImmersionDb(client);
  }

  // prettier-ignore
  const immersionApplicationTableAlreadyExists = await checkIfTableExists("immersion_applications");
  if (!immersionApplicationTableAlreadyExists) {
    logger.info("We will thus create the immersion_applications table");
    await buildImmersionApplication(client);
  }

  // prettier-ignore
  const formEstablishmentTableAlreadyExists = await checkIfTableExists("form_establishments");
  if (!formEstablishmentTableAlreadyExists) {
    logger.info("We will thus create the form_establishments table");
    await buildFormEstablishment(client);
  }

  // prettier-ignore
  const agenciesTableAlreadyExists = await checkIfTableExists("agencies");
  if (!agenciesTableAlreadyExists) {
    logger.info("We will thus create the agencies table");
    await buildAgencies(client);
    if (shouldPopulateWithTestData(appConfig)) {
      logger.info("Inserting test data into the agencies table");
      await insertTestAgencies(
        client,
        createAgencyConfigsFromAppConfig(appConfig),
      );
    }
  }

  await client.release();
};

const makeCheckIfTableAlreadyExists =
  (client: PoolClient) =>
  async (tableName: string): Promise<boolean> => {
    try {
      // template strings for sql queries should be avoided, but how to pass table name otherwise ?
      await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
      logger.info(`${tableName} table already exists`);
      return true;
    } catch (e: any) {
      logger.info(
        `${tableName} does not exists, trying to query got: ${e.message}`,
      );
      return false;
    }
  };

const buildSearchImmersionDb = async (client: PoolClient) => {
  const file = await readFile(__dirname + "/database.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildImmersionApplication = async (client: PoolClient) => {
  // prettier-ignore
  const file = await readFile(__dirname + "/createImmersionApplicationsTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildFormEstablishment = async (client: PoolClient) => {
  const file = await readFile(__dirname + "/createFormEstablishmentsTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildAgencies = async (client: PoolClient) => {
  const file = await readFile(__dirname + "/createAgenciesTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const shouldPopulateWithTestData = (appConfig: AppConfig) => {
  switch (appConfig.nodeEnv) {
    case "local":
    case "test":
      return true;
    case "production":
      switch (appConfig.envType) {
        case "dev":
        case "staging":
          return true;
      }
  }
  return false;
};

const insertTestAgencies = async (
  client: PoolClient,
  agencies: AgencyConfig[],
) => {
  const agencyRepository = new PgAgencyRepository(client);
  for (const agency of Object.values(agencies)) {
    await agencyRepository.insert(agency);
  }
};

buildDb().then(() => {
  logger.info("Migrated db successfully");
});
