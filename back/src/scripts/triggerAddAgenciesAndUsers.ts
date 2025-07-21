import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";
import { z } from "zod";
import { keys } from "ramda";
import { Phone, phoneSchema } from "shared";
import { makeAddAgenciesAndUsers } from "../domains/agency/use-cases/AddAgenciesAndUsers";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";

// Upload a file to the one-off container (target is /tmp/uploads)
// scalingo --app my-app run --file ./dump.sql <command>

// Then run this file with:
// pnpm back trigger-add-agencies-and-users /tmp/uploads/export.csv

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type ImportedAgencyAndUserRow = {
  "ID": string;
  "SIRET": string;
  "Type structure": string;
  "Nom structure": string;
  "E-mail authentification": string;
  "Adresse ligne 1": string;
  "Adresse ligne 2": string;
  "Ville": string;
  "Téléphone": Phone;
};

const importedAgencyAndUserRowSchema: z.Schema<ImportedAgencyAndUserRow> = z.object({
  "ID": z.string(),
  "SIRET": z.string(),
  "Type structure": z.string(),
  "Nom structure": z.string(),
  "E-mail authentification": z.string(),
  "Adresse ligne 1": z.string(),
  "Adresse ligne 2": z.string(),
  "Ville": z.string(),
  "Téléphone": phoneSchema.or(z.string().length(0)),
});

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
  const validatedRows: ImportedAgencyAndUserRow[] = result.data.map((row, index) => {
    try {
      const importedRow = importedAgencyAndUserRowSchema.parse(row);
      return importedRow;
    } catch (error) {
      if (error instanceof z.ZodError) {
        parsedErrors[index+skipLines] = JSON.stringify(error);
      }
    }
    return null;
  }).filter((row) => row !== null);

  logger.info({ message: `Ready to import ${validatedRows.length} lines` });


  const { alreadyExistingAgencies, createdAgencies, alreadyExistingUsers, createdUsers } = await makeAddAgenciesAndUsers({
    uowPerformer: createUowPerformer(config, createGetPgPoolFn(config)).uowPerformer,
    deps: {},
  }).execute(validatedRows);

  return {
    alreadyExistingAgencies,
    createdAgencies,
    alreadyExistingUsers,
    createdUsers,
    errors: keys(parsedErrors).length !== 0 ? `${keys(parsedErrors).length} error(s) during CSV parsing: ${keys(parsedErrors).map((key) => `line ${key}: ${parsedErrors[key]}`).join("\n")}` : 0,
  };
};

handleCRONScript(
  "addAgenciesAndUsers",
  config,
  triggerAddAgenciesAndUsers,
  ({
    alreadyExistingAgencies,
    createdAgencies,
    alreadyExistingUsers,
    createdUsers,
    errors,
  }) =>
    [
      `Already existing agencies: ${alreadyExistingAgencies}`,
      `Created agencies: ${createdAgencies}`,
      `Already existing users: ${alreadyExistingUsers}`,
      `Created users: ${createdUsers}`,
      `Errors: ${errors}`,
    ].join("\n"),
  logger,
);
