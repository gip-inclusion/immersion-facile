import { Client } from "pg";
import fs from "fs";
import { promisify } from "util";
import { createLogger } from "../../../../utils/logger";
import { sleep } from "../../../../shared/utils";
import { AppConfig } from "../../../primary/appConfig";

const logger = createLogger(__filename);

const readFile = promisify(fs.readFile);

const tryToConnect = async (
  connectionString: string,
  tryNumber = 0,
): Promise<Client> => {
  if (tryNumber >= 5)
    throw new Error("Tried to connect 5 times without success");
  try {
    logger.info("Trying to connect to DB ...");
    const client = new Client({ connectionString });
    await client.connect();
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

  const immersionOffersTableAlreadyExists =
    await checkIfSearchImmersionOffersTableAlreadyExists(client);
  if (!immersionOffersTableAlreadyExists) {
    logger.info("We will thus construct the database");
    await buildSearchImmersionDb(client);
  }

  const immersionApplicationTableAlreadyExists =
    await checkIfSearchImmersionApplicationTableAlreadyExists(client);
  if (!immersionApplicationTableAlreadyExists) {
    logger.info("We will thus create the immersion_applications table");
    await buildImmersionApplication(client);
  }

  await client.end();
};

const checkIfSearchImmersionOffersTableAlreadyExists = async (
  client: Client,
): Promise<boolean> => {
  try {
    await client.query("SELECT * FROM immersion_offers LIMIT 1");
    logger.info("immersion_offers table already exists");
    return true;
  } catch (e: any) {
    logger.info(
      `immersion_offers does not exists, trying to query got: ${e.message}`,
    );
    return false;
  }
};

const checkIfSearchImmersionApplicationTableAlreadyExists = async (
  client: Client,
): Promise<boolean> => {
  try {
    await client.query("SELECT * FROM immersion_applications LIMIT 1");
    logger.info("immersion_applications table was already built");
    return true;
  } catch (e: any) {
    logger.info(
      "immersion_applications is not built yet. The query returned: ",
      e.message,
    );
    return false;
  }
};

const buildSearchImmersionDb = async (client: Client) => {
  const file = await readFile(__dirname + "/database.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildImmersionApplication = async (client: Client) => {
  const file = await readFile(
    __dirname + "/createImmersionApplicationsTable.sql",
  );
  const sql = file.toString();
  await client.query(sql);
};

buildDb().then(() => {
  logger.info("Migrated db successfully");
});
