import fs from "fs";
import { Pool, PoolClient } from "pg";
import { promisify } from "util";
import { sleep } from "../../../../shared/utils";
import { createLogger } from "../../../../utils/logger";
import { AppConfig } from "../../../primary/appConfig";
import {
  addTsVectorData,
  insertAppellationPublicData,
  insertRomesPublicData,
} from "./insertAppellationAndRomesPublicData";

const logger = createLogger(__filename);

const readFile = promisify(fs.readFile);

const tryToConnect = async (
  connectionString: string,
  tryNumber = 0,
): Promise<{ client: PoolClient; pool: Pool }> => {
  if (tryNumber >= 10)
    throw new Error(`Tried to connect ${tryNumber} times without success`);
  try {
    logger.info(
      `Trying to connect to DB : ${connectionString} try number : ${tryNumber}`,
    );
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    logger.info("Successfully connected");
    return { client, pool };
  } catch (e: any) {
    const newTryNumber = tryNumber + 1;
    logger.error(
      `Could not connect to DB (error: ${e.message}). Try number: ${newTryNumber}, will try again in 15s`,
    );
    console.log("error : ", e);
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

  const { client, pool } = await tryToConnect(pgUrl);
  const checkIfTableExists = makeCheckIfTableAlreadyExists(client);
  const isQuerySuccessful = makeIsQuerySuccessful(client);

  // prettier-ignore
  const immersionOffersTableAlreadyExists = await checkIfTableExists("immersion_offers");
  if (!immersionOffersTableAlreadyExists) {
    logger.info("We will thus construct the database");
    await buildSearchImmersionDb(client);
  }

  // prettier-ignore
  const pkSearchMadeExists = await isQuerySuccessful("SELECT id FROM searches_made");
  if (!pkSearchMadeExists) {
    logger.info("We will thus change primary key");
    await addSearchMadeId(client);
  }

  // prettier-ignore
  logger.info("We create is_active column if not exists ");
  await addIsActive(client);

  const establishmentsTimestampHaveTz =
    await checkIfEstablishmentsTimestampHaveTz(client);
  if (!establishmentsTimestampHaveTz) {
    logger.info("change establishment timestamps to timestamps with timezone");
    await changeEstablishmentTimestampWithTZ(client);
  } else {
    logger.info("establishment timestamps already have timezone");
  }

  // prettier-ignore
  const lbbRequestTableAlreadyExists = await checkIfTableExists("lbb_requests");
  if (!lbbRequestTableAlreadyExists) {
    logger.info("We will thus create the lbb_requests table");
    await buildLaBonneBoiteRequestTable(client);
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
  // no existence checks as it will be taken care of in the ALTER clause within Postgres
  await alterFormEstablishment(client);

  // prettier-ignore
  const agenciesTableAlreadyExists = await checkIfTableExists("agencies");
  if (!agenciesTableAlreadyExists) {
    await buildAgencies(client);
    if (shouldPopulateWithTestData(appConfig)) {
      await insertTestAgencies(client);
    }
  }
  await alterAgencies(client);

  const outboxTableAlreadyExists = await checkIfTableExists("outbox");
  if (!outboxTableAlreadyExists) {
    logger.info("We will thus create the outbox table");
    await buildOutbox(client);
  }

  // prettier-ignore
  const appellationsPublicDataTableAlreadyExists = await checkIfTableExists("appellations_public_data");
  if (!appellationsPublicDataTableAlreadyExists) {
    await buildRomesAppellations(client);
    await insertRomesAppellations(client);
  }

  // prettier-ignore
  const nafClassesDataTableAlreadyExists = await checkIfTableExists("naf_classes_2008");
  if (!nafClassesDataTableAlreadyExists) {
    await buildAndInsertNafClasses(client);
  }

  logger.info("adding postal code to immersion application if needed...");
  await addPostalCodeToImmersionApplication(client);

  logger.info("change outbox occurred_at to timestamp with timezone");
  await changeOutboxOccurredAtToTimestampWithTZ(client);

  client.release();
  await pool.end();
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

const makeIsQuerySuccessful =
  (client: PoolClient) =>
  async (query: string): Promise<boolean> => {
    try {
      await client.query(query);
      logger.info({ query }, "Query succeeded");
      return true;
    } catch (e: any) {
      logger.info({ query }, "Query failed");
      return false;
    }
  };

const checkIfEstablishmentsTimestampHaveTz = async (client: PoolClient) => {
  const makeQuery = (
    columnName: string,
  ) => `SELECT column_name, data_type FROM information_schema.columns WHERE
  table_name = 'establishments' AND column_name = '${columnName}'`;

  const update_result = await client.query(makeQuery("update_date"));
  const creation_result = await client.query(makeQuery("creation_date"));

  const update_date_has_tz =
    update_result.rows[0].data_type === "timestamp without time zone";
  const creation_data_has_tz =
    creation_result.rows[0].data_type === "timestamp without time zone";

  return update_date_has_tz && creation_data_has_tz;
};

const buildSearchImmersionDb = async (client: PoolClient) => {
  await executeSqlFromFile(__dirname + "/database.sql", client);
};

const addSearchMadeId = async (client: PoolClient) => {
  await executeSqlFromFile(__dirname + "/addSearchMadeId.sql", client);
};

const addIsActive = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/addIsActiveToTableEstablishments.sql",
    client,
  );
};

const changeEstablishmentTimestampWithTZ = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/changeEstablishmentTimestampWithTZ.sql",
    client,
  );
};

const buildLaBonneBoiteRequestTable = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/createLaBonneBoiteRequestTable.sql",
    client,
  );
};

const buildOutbox = async (client: PoolClient) => {
  await executeSqlFromFile(__dirname + "/outbox.sql", client);
};

const buildImmersionApplication = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/createImmersionApplicationsTable.sql",
    client,
  );
};

const buildFormEstablishment = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/createFormEstablishmentsTable.sql",
    client,
  );
};

const alterFormEstablishment = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/alterFormEstablishmentsTable.sql",
    client,
  );
};

const alterAgencies = async (client: PoolClient) => {
  await executeSqlFromFile(__dirname + "/alterAgenciesTable.sql", client);
};

const addPostalCodeToImmersionApplication = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/addPostalCodeToImmersionApplicationTable.sql",
    client,
  );
};

const changeOutboxOccurredAtToTimestampWithTZ = async (client: PoolClient) => {
  await executeSqlFromFile(
    __dirname + "/changeOutboxOccurredAtToTimestampWithTZ.sql",
    client,
  );
};

const buildAgencies = async (client: PoolClient) => {
  logger.info("agencies: creating table");
  await executeSqlFromFile(__dirname + "/createAgenciesTable.sql", client);
};

const insertTestAgencies = async (client: PoolClient) => {
  logger.info("agencies: inserting test data");
  await executeSqlFromFile(__dirname + "/insertTestAgencies.sql", client);
};

const buildRomesAppellations = async (client: PoolClient) => {
  logger.info("romes and appellations data: creating tables");
  await executeSqlFromFile(
    __dirname + "/createAppellationAndRomePublicDataTables.sql",
    client,
  );
  console.log("created rome");
};

const insertRomesAppellations = async (client: PoolClient) => {
  logger.info("romes and appellations data: inserting public data");
  await insertRomesPublicData(client);
  await insertAppellationPublicData(client);
  await addTsVectorData(client);
};

const buildAndInsertNafClasses = async (client: PoolClient) => {
  logger.info("NAF classes data: creating tables");
  await executeSqlFromFile(__dirname + "/createNafClassesTable.sql", client);
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

const executeSqlFromFile = async (path: string, client: PoolClient) => {
  const file = await readFile(path);
  const sql = file.toString();
  await client.query(sql);
};

buildDb().then(() => {
  logger.info("Migrated db successfully");
});
