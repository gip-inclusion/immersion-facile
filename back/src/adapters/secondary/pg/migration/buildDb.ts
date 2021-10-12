import { Client } from "pg";
import fs from "fs";
import { promisify } from "util";
import { ENV } from "../../../primary/environmentVariables";

const readFile = promisify(fs.readFile);

const buildDb = async (connectionString: string) => {
  const client = new Client({ connectionString });
  await client.connect();

  const immersionDbAlreadyBuilt = await checkIfSearchImmersionDbAlreadyBuilt(
    client,
  );

  if (!immersionDbAlreadyBuilt) {
    console.log("We will thus construct the database");
    await builtSearchImmersionDb(client);
  }

  await client.end();
};

const checkIfSearchImmersionDbAlreadyBuilt = async (
  client: Client,
): Promise<boolean> => {
  try {
    await client.query("SELECT * FROM immersion_offers LIMIT 1");
    console.log("DB was already built");
    return true;
  } catch (e) {
    console.log("DB is not already built, try to query got: ", e.message);
    return false;
  }
};

const builtSearchImmersionDb = async (client: Client) => {
  const file = await readFile(__dirname + "/database.sql");
  const sql = file.toString();
  await client.query(sql);
};

const pgUrl = process.argv[2];

if (!pgUrl) throw new Error("Please provide PG url");

console.log("Starting build db script for db url : ", pgUrl);

buildDb(process.argv[2]);
