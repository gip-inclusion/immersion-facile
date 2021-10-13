import { Client } from "pg";
import fs from "fs";
import { promisify } from "util";
import { createLogger } from "../../../../utils/logger";

const logger = createLogger(__filename);

const readFile = promisify(fs.readFile);

const buildDb = async (connectionString: string) => {
  const client = new Client({ connectionString });
  await client.connect();

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
  } catch (e) {
    logger.info(
      "immersion_offers does not exists, trying to query got: ",
      e.message,
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

const pgUrl = process.argv[2];

if (!pgUrl) throw new Error("Please provide PG url");

logger.info("Starting build db script for db url : ", pgUrl);

buildDb(process.argv[2]).then(() => {
  logger.info("Migrated db successfully");
});
