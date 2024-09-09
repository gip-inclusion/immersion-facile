import { v4 as uuid } from "uuid";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeKyselyDb, values } from "../config/pg/kysely/kyselyUtils";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const executeUsecase = async (): Promise<{
  inCSV: number;
  updated: number;
  withoutProConnectIdBeforeUpdate: number;
  withoutProConnectIdAfterUpdate?: {
    id: string;
    email: string;
    external_id_inclusion_connect: string | null;
  }[];
}> => {
  //
  // MISSING CSV Import part
  //

  const fake_CSV_Values: { icExternalId: string; pcExternalId: string }[] = [
    {
      icExternalId: "e9dce090-f45e-46ce-9c58-4fbbb3e494ba",
      pcExternalId: uuid(),
    },
  ];

  const pool = createGetPgPoolFn(config)();
  const db = makeKyselyDb(pool);

  const getUserToUpdateQueryBuilder = db
    .selectFrom("users")
    .select(["id", "email", "external_id_inclusion_connect"])
    .where("external_id_inclusion_connect", "is not", null)
    .where("external_id_pro_connect", "is", null);

  const withoutProConnectIdBeforeUpdate =
    await getUserToUpdateQueryBuilder.execute();

  if (fake_CSV_Values.length === 0)
    return {
      inCSV: fake_CSV_Values.length,
      updated: 0,
      withoutProConnectIdBeforeUpdate: withoutProConnectIdBeforeUpdate.length,
    };

  const updatedUserIds = await db
    .updateTable("users")
    .from(values(fake_CSV_Values, "mapping"))
    .set((eb) => ({
      external_id_pro_connect: eb.ref("mapping.pcExternalId"),
    }))
    .whereRef("mapping.icExternalId", "=", "external_id_inclusion_connect")
    .returning("id")
    .execute();

  const userWithIcExternalAndWithoutPcExternalId =
    await getUserToUpdateQueryBuilder.execute();

  return {
    inCSV: fake_CSV_Values.length,
    withoutProConnectIdBeforeUpdate: withoutProConnectIdBeforeUpdate.length,
    updated: updatedUserIds.length,
    withoutProConnectIdAfterUpdate: userWithIcExternalAndWithoutPcExternalId,
  };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
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
                ({ id, email, external_id_inclusion_connect }) =>
                  `- ${id} - ${email} - ${external_id_inclusion_connect}`,
              ),
            ].join("\n    ")}`,
          ]
        : []),
    ].join("\n");
  },
  logger,
);
