import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { keys } from "ramda";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createFetchHttpClientForExternalAPIs } from "../config/bootstrap/createGateways";
import { partnerNames } from "../config/bootstrap/partnerNames";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import {
  type ImportedAgencyAndUserRow,
  importedAgencyAndUserRowSchema,
  makeAddAgenciesAndUsers,
} from "../domains/agency/use-cases/AddAgenciesAndUsers";
import { HttpAddressGateway } from "../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../domains/core/address/adapters/HttpAddressGateway.routes";
import { withNoCache } from "../domains/core/caching-gateway/adapters/withNoCache";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

// Upload a file to the one-off container (target is /tmp/uploads)
// scalingo --app my-app --region my-region run --file "/path/to/file.csv" bash

// confirm that file is on the container
// ls /tmp/uploads

// Then run this file with:
// pnpm back trigger-add-agencies-and-users /tmp/uploads/export.csv

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerAddAgenciesAndUsers = async () => {
  logger.info({ message: "Starting to add agencies and users from csv" });

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

  const { validatedRows, parsingErrorsCount } =
    validateRowsAndReplaceInvalidPhoneNumber(result.data);

  logger.info({ message: `Ready to import ${validatedRows.length} lines` });

  const {
    siretAlreadyInIFCount,
    createdAgenciesCount,
    createdUsersCount,
    usersAlreadyInIFCount,
    usecaseErrors,
  } = await makeAddAgenciesAndUsers({
    uowPerformer: createUowPerformer(config, createMakeProductionPgPool(config))
      .uowPerformer,
    deps: {
      timeGateway: new RealTimeGateway(),
      uuidGenerator: new UuidV4Generator(),
      addressGateway: new HttpAddressGateway(
        createFetchHttpClientForExternalAPIs({
          partnerName: partnerNames.openCageData,
          routes: addressesExternalRoutes,
          config,
        }),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
        withNoCache,
      ),
    },
  }).execute(validatedRows);

  const usecaseErrorsKeys = keys(usecaseErrors);
  if (usecaseErrorsKeys) {
    logger.warn({ message: `${usecaseErrorsKeys.length} errors in usecase` });
    usecaseErrorsKeys.forEach((key) => {
      logger.warn({
        message: `ID ${key}: ${usecaseErrors[key]}`,
      });
    });
  }

  logger.info({ message: "End of importing agencies and users from csv" });

  return {
    siretAlreadyInIFCount,
    createdAgenciesCount,
    createdUsersCount,
    usersAlreadyInIFCount,
    parsingErrorsCount,
    usecaseErrorsCount: usecaseErrorsKeys.length,
  };
};

const validateRowsAndReplaceInvalidPhoneNumber = (
  data: any[],
): {
  parsingErrorsCount: number;
  validatedRows: ImportedAgencyAndUserRow[];
} => {
  const defaultPhoneNumber = "+33500000000";
  const parsedErrors: Record<number, string> = {};
  const skipLines = 2; //1 for index that starts at 0 + 1 for header

  const validatedRows: ImportedAgencyAndUserRow[] = data
    .map((row, index) => {
      const parseResult = importedAgencyAndUserRowSchema.safeParse(row);
      if (parseResult.success) return parseResult.data;
      parsedErrors[index + skipLines] = JSON.stringify(parseResult.error);
      return null;
    })
    .filter((row) => row !== null);

  if (keys(parsedErrors).length !== 0) {
    const additionnalValidatedLinesAndRows = keys(parsedErrors)
      .map((key) => {
        if (parsedErrors[key].includes("Téléphone")) {
          const parseResult = importedAgencyAndUserRowSchema.safeParse({
            ...data.at(key - skipLines),
            Téléphone: defaultPhoneNumber,
          });
          if (parseResult.success) {
            return {
              line: key,
              row: parseResult.data,
            };
          }
        }
        return null;
      })
      .filter((row) => row !== null);
    const additionnalValidatedLines = additionnalValidatedLinesAndRows.map(
      ({ line }) => line,
    );
    const additionnalValidatedRows = additionnalValidatedLinesAndRows.map(
      ({ row }) => row,
    );

    logger.warn({
      message: `${keys(parsedErrors).length - additionnalValidatedLines.length} error(s) during CSV parsing`,
    });

    keys(parsedErrors).forEach((key) => {
      if (!additionnalValidatedLines.includes(key)) {
        logger.warn({
          message: `line ${key}: ${parsedErrors[key]}`,
        });
      }
    });

    return {
      validatedRows: [...validatedRows, ...additionnalValidatedRows],
      parsingErrorsCount:
        keys(parsedErrors).length - additionnalValidatedLines.length,
    };
  }

  return {
    validatedRows,
    parsingErrorsCount: 0,
  };
};

handleCRONScript(
  "addAgenciesAndUsers",
  config,
  triggerAddAgenciesAndUsers,
  ({
    siretAlreadyInIFCount,
    createdAgenciesCount,
    usersAlreadyInIFCount,
    createdUsersCount,
    parsingErrorsCount,
    usecaseErrorsCount,
  }) =>
    [
      `Already existing agencies: ${siretAlreadyInIFCount}`,
      `Created agencies: ${createdAgenciesCount}`,
      `Already existing users: ${usersAlreadyInIFCount}`,
      `Created users: ${createdUsersCount}`,
      `Parsing errors count: ${parsingErrorsCount}`,
      `Usecase errors count: ${usecaseErrorsCount}`,
    ].join("\n"),
  logger,
);
