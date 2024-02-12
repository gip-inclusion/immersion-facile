import { Pool } from "pg";
import { keys } from "ramda";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../../domain/generic/notifications/entities/Notification";
import { SendEstablishmentLeadReminderScript } from "../../../domain/offer/useCases/SendEstablishmentLeadReminderScript";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { DeterministShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { NanoIdShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/NanoIdShortLinkIdGeneratorGateway";
import { AppConfig } from "../config/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../config/magicLinkUrl";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerEstablishmentLeadFirstReminder = async () => {
  logger.info("Starting to send Emails to establishment leads");
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const timeGateway = new RealTimeGateway();
  const { uowPerformer } = createUowPerformer(config, () => pool);
  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );
  const uuidGenerator = new UuidV4Generator();

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );
  const shortLinkIdGeneratorGateway = new NanoIdShortLinkIdGeneratorGateway();

  const sendEstablishmentLeadReminderScript =
    new SendEstablishmentLeadReminderScript(
      uowPerformer,
      saveNotificationAndRelatedEvent,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
      shortLinkIdGeneratorGateway,
      config,
      makeGenerateConventionMagicLinkUrl(config, generateConventionJwt),
      timeGateway,
    );

  return sendEstablishmentLeadReminderScript.execute("to-be-reminded");
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "sendEstablishmentLeadFirstReminderScript",
  config,
  triggerEstablishmentLeadFirstReminder,
  ({ establishmentsReminded, errors = {} }) => {
    const failures = keys(errors);
    const numberOfFailures = failures.length;
    const numberOfSuccess = establishmentsReminded.length - numberOfFailures;

    const errorsAsString = failures
      .map(
        (conventionId) =>
          `For immersion ids ${conventionId} : ${errors[conventionId]} `,
      )
      .join("\n");

    return [
      `Total of establismentLead reminded : ${numberOfSuccess}`,
      `Number of failures : ${numberOfFailures}`,
      ...(numberOfFailures > 0 ? [`Failures : ${errorsAsString}`] : []),
    ].join("\n");
  },
  logger,
);
