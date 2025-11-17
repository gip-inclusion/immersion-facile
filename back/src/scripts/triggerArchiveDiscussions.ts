import { subYears } from "date-fns";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { makeArchiveDiscussions } from "../domains/establishment/use-cases/discussions/ArchiveDiscussions";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const archiveOldDiscussions = async () => {
  const uowPerformer = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  ).uowPerformer;

  const timeGateway = new RealTimeGateway();

  const limit = 5000;
  const oneYearAgo = subYears(timeGateway.now(), 1);
  const twoYearsAgo = subYears(timeGateway.now(), 2);

  const deleteDiscussions = makeArchiveDiscussions({
    uowPerformer,
  });
  const { archivedDiscussionsQty: archivedRejectedOneYearAgoDiscussionsQty } =
    await deleteDiscussions.execute({
      statuses: ["REJECTED"],
      lastUpdated: oneYearAgo,
      limit,
    });

  const {
    archivedDiscussionsQty: archivedAcceptedOrPendingTwoYearsAgoDiscussionsQty,
  } = await deleteDiscussions.execute({
    statuses: ["ACCEPTED", "PENDING"],
    lastUpdated: twoYearsAgo,
    limit,
  });

  return {
    archivedRejectedOneYearAgoDiscussionsQty,
    archivedAcceptedOrPendingTwoYearsAgoDiscussionsQty,
  };
};

handleCRONScript({
  name: "archiveOldDiscussions",
  config,
  script: archiveOldDiscussions,
  handleResults: ({
    archivedAcceptedOrPendingTwoYearsAgoDiscussionsQty,
    archivedRejectedOneYearAgoDiscussionsQty,
  }) =>
    `Archived discussions : 
      - ${archivedRejectedOneYearAgoDiscussionsQty} rejected one year ago
      - ${archivedAcceptedOrPendingTwoYearsAgoDiscussionsQty} accepted/pending two years ago`,
  logger,
});
