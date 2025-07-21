import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { keys } from "ramda";
import { z } from "zod";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import {
  type ImportedAgencyAndUserRow,
  importedAgencyAndUserRowSchema,
  makeAddAgenciesAndUsers,
} from "../domains/agency/use-cases/AddAgenciesAndUsers";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

// Upload a file to the one-off container (target is /tmp/uploads)
// scalingo --app my-app run --file ./dump.sql <command>

// Then run this file with:
// pnpm back trigger-add-agencies-and-users /tmp/uploads/export.csv

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerAddAgenciesAndUsers = async () => {
  logger.info({ message: "Starting to add agencies and users" });

  const path = process.argv.slice(2)[0];
  if (!path.endsWith(".csv")) {
    logger.error({ message: "Le fichier n'est pas un CSV" });
    throw new Error("Le fichier n'est pas un CSV");
  }

  const fileContent = await readFile(path, "utf-8");
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(
      `Erreur(s) lors du parsing CSV: ${JSON.stringify(result.errors)}`,
    );
  }

  const parsedErrors: Record<number, string> = {};
  const skipLines = 2; //1 for index that starts at 0 + 1 for header
  const validatedRows: ImportedAgencyAndUserRow[] = result.data
    .map((row, index) => {
      try {
        const importedRow = importedAgencyAndUserRowSchema.parse(row);
        return importedRow;
      } catch (error) {
        if (error instanceof z.ZodError) {
          parsedErrors[index + skipLines] = JSON.stringify(error);
        }
      }
      return null;
    })
    .filter((row) => row !== null);

  logger.info({ message: `Ready to import ${validatedRows.length} lines` });

  const { createdAgenciesCount, createdUsersCount, updatedUsersCount } =
    await makeAddAgenciesAndUsers({
      uowPerformer: createUowPerformer(config, createGetPgPoolFn(config))
        .uowPerformer,
      deps: {
        timeGateway: new RealTimeGateway(),
        uuidGenerator: new UuidV4Generator(),
      },
    }).execute(validatedRows);

  return {
    createdAgenciesCount,
    createdUsersCount,
    updatedUsersCount,
    errors:
      keys(parsedErrors).length !== 0
        ? `${keys(parsedErrors).length} error(s) during CSV parsing: ${keys(
            parsedErrors,
          )
            .map((key) => `line ${key}: ${parsedErrors[key]}`)
            .join("\n")}`
        : 0,
  };
};

handleCRONScript(
  "addAgenciesAndUsers",
  config,
  triggerAddAgenciesAndUsers,
  ({ createdAgenciesCount, createdUsersCount, updatedUsersCount, errors }) =>
    [
      //`Already existing agencies: ${alreadyExistingAgencies}`,
      `Created agencies: ${createdAgenciesCount}`,
      `Already existing users: ${updatedUsersCount}`,
      `Created users: ${createdUsersCount}`,
      `Errors: ${errors}`,
    ].join("\n"),
  logger,
);
