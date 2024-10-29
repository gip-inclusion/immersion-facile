import { resolve } from "node:path";
import { readFile } from "fs/promises";
import Papa from "papaparse";
import { z } from "zod";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeKyselyDb, values } from "../config/pg/kysely/kyselyUtils";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const executeUsecase = async (): Promise<{
  inCSV: number;
  updated: number;
  withoutProConnectIdBeforeUpdate: number;
  withoutProConnectIdAfterUpdate?: {
    id: string;
    email: string;
    inclusion_connect_sub: string | null;
  }[];
}> => {
  const filename = "import_CSV_proconnect.csv"; // CSV file to save in immersion-facile root project folder
  const path = `../${filename}`;
  const rawFile = await readFile(resolve(path), { encoding: "utf8" });

  logger.info({ message: `START - Parsing CSV on path ${path}.` });
  const csv = Papa.parse(rawFile, {
    header: true,
    skipEmptyLines: true,
  });
  logger.info({ message: `DONE - Parsing CSV on path ${path}.` });

  const csvSchema: z.Schema<
    {
      inclusionConnectSub: string;
      proConnectSub: string;
    }[]
  > = z.array(
    z.object({
      inclusionConnectSub: z.string().uuid(),
      proConnectSub: z.string().uuid(),
    }),
  );

  const csvData = csv.data;
  logger.info({ message: `START - Schema parse CSV data : ${csvData.length}` });
  const csvValues = csvSchema.parse(csvData);
  logger.info({ message: `DONE - Schema parsed values : ${csvValues.length}` });

  const pool = createGetPgPoolFn(config)();
  const db = makeKyselyDb(pool);

  const getUserToUpdateQueryBuilder = db
    .selectFrom("users")
    .select(["id", "email", "inclusion_connect_sub"])
    .where("inclusion_connect_sub", "is not", null)
    .where("pro_connect_sub", "is", null);

  logger.info({ message: "START - Get users without ProConnect sub" });
  const withoutProConnectIdBeforeUpdate =
    await getUserToUpdateQueryBuilder.execute();
  logger.info({
    message: `DONE - users without ProConnect sub : ${withoutProConnectIdBeforeUpdate.length}`,
  });

  if (csvValues.length === 0)
    return {
      inCSV: csvValues.length,
      updated: 0,
      withoutProConnectIdBeforeUpdate: withoutProConnectIdBeforeUpdate.length,
    };

  logger.info({ message: "START - Update users" });
  const updatedUserIds = await db
    .updateTable("users")
    .from(values(csvValues, "mapping"))
    .set((eb) => ({
      pro_connect_sub: eb.ref("mapping.proConnectSub"),
    }))
    .whereRef("mapping.inclusionConnectSub", "=", "inclusion_connect_sub")
    .returning("id")
    .execute();
  logger.info({ message: `DONE - ${updatedUserIds.length} Updated users` });

  logger.info({ message: "START - Get users without ProConnect sub" });
  const userWithIcExternalAndWithoutPcExternalId =
    await getUserToUpdateQueryBuilder.execute();
  logger.info({
    message: `DONE - users without ProConnect sub : ${userWithIcExternalAndWithoutPcExternalId.length}`,
  });

  return {
    inCSV: csvValues.length,
    withoutProConnectIdBeforeUpdate: withoutProConnectIdBeforeUpdate.length,
    updated: updatedUserIds.length,
    withoutProConnectIdAfterUpdate: userWithIcExternalAndWithoutPcExternalId,
  };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleCRONScript(
  "importProConnectExternalIds",
  config,
  executeUsecase,
  ({
    inCSV,
    updated,
    withoutProConnectIdBeforeUpdate,
    withoutProConnectIdAfterUpdate,
  }) => {
    return [
      `Number of users without Pro Connect external Ids to update : ${withoutProConnectIdBeforeUpdate}`,
      `Number of external Ids mapping in CSV : ${inCSV}`,
      `Number of users updated with Pro Connect external Ids: ${updated}`,
      ...(withoutProConnectIdAfterUpdate
        ? [
            `Number of users that still not have Pro Connect external Id details : ${withoutProConnectIdAfterUpdate.length}`,
            `Details : 
            ${[
              "   USER ID       |     EMAIL      |       IC_EXTERNAL_ID",
              ...withoutProConnectIdAfterUpdate.map(
                ({ id, email, inclusion_connect_sub }) =>
                  `- ${id} - ${email} - ${inclusion_connect_sub}`,
              ),
            ].join("\n    ")}`,
          ]
        : []),
    ].join("\n");
  },
  logger,
);
