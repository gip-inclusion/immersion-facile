import type { UserId } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { AssignAgencyViewerRole } from "../domains/agency/use-cases/AssignAgencyViewerRoleToUsers";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const TARGET_USER_IDS: UserId[] = [
  "4551456d-16ae-4666-a715-48571e7463a2",
  "ecfbb271-98a4-4734-8f0b-abaaefc508e6",
];

const TARGET_AGENCY_KINDS: (
  | "pole-emploi"
  | "cap-emploi"
  | "conseil-departemental"
)[] = ["pole-emploi", "cap-emploi", "conseil-departemental"];

const executeAssignAgencyViewerRole = async () => {
  logger.info({
    message: "Starting agency viewer role assignment on FT users script",
  });

  const { uowPerformer } = createUowPerformer(
    config,
    createGetPgPoolFn(config),
  );

  const assignAgencyViewerRoleUseCase = new AssignAgencyViewerRole(
    uowPerformer,
  );

  return assignAgencyViewerRoleUseCase.execute({
    userIds: TARGET_USER_IDS,
    agencyKinds: TARGET_AGENCY_KINDS,
  });
};

handleCRONScript(
  "assignAgencyViewerRoleToFTUsers",
  config,
  executeAssignAgencyViewerRole,
  ({ agenciesSuccessfullyUpdated, agencyUpdatesFailed, agenciesSkipped }) => {
    return [
      `Agencies successfully updated: ${agenciesSuccessfullyUpdated}`,
      `Agencies failed to update: ${agencyUpdatesFailed}`,
      `Agencies skipped: ${agenciesSkipped}`,
      "",
      `Total agencies processed: ${agenciesSuccessfullyUpdated + agencyUpdatesFailed + agenciesSkipped}`,
    ].join("\n");
  },
  logger,
);
