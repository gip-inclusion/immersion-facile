import { subDays } from "date-fns";
import { Pool } from "pg";
import { keys } from "ramda";
import { SiretDto } from "shared";
import { makeCreateNewEvent } from "../../../domains/core/events/ports/EventBus";
import { makeGenerateJwtES256 } from "../../../domains/core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../../domains/core/notifications/helpers/Notification";
import { NanoIdShortLinkIdGeneratorGateway } from "../../../domains/core/short-link/adapters/short-link-generator-gateway/NanoIdShortLinkIdGeneratorGateway";
import { RealTimeGateway } from "../../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../../../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  SendEstablishmentLeadReminderOutput,
  SendEstablishmentLeadReminderScript,
} from "../../../domains/offer/useCases/SendEstablishmentLeadReminderScript";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../config/magicLinkUrl";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerEstablishmentLeadReminders = async () => {
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

  const firstReminderResult = await sendEstablishmentLeadReminderScript.execute(
    { kind: "to-be-reminded" },
  );

  const secondReminderResult =
    await sendEstablishmentLeadReminderScript.execute({
      kind: "reminder-sent",
      beforeDate: subDays(timeGateway.now(), 7),
    });

  return { firstReminderResult, secondReminderResult };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "sendEstablishmentLeadFirstReminderScript",
  config,
  triggerEstablishmentLeadReminders,
  ({ firstReminderResult, secondReminderResult }) =>
    [
      "First reminder:",
      ...reminderReport(firstReminderResult),
      "---",
      "Second reminder:",
      ...reminderReport(secondReminderResult),
    ].join("\n"),
  logger,
);

const reminderReport = ({
  establishmentsReminded,
  errors,
}: SendEstablishmentLeadReminderOutput) => {
  const failures = keys(errors);
  const numberOfFailures = failures.length;

  return [
    `Total of establishmentLead reminded : ${
      establishmentsReminded.length - numberOfFailures
    }`,
    `Number of failures : ${numberOfFailures}`,
    ...(numberOfFailures > 0 ? [`Failures : ${errorsAsString(errors)}`] : []),
  ].join("\n");
};

const errorsAsString = (errors: Record<SiretDto, Error> = {}): string => {
  const sirets = keys(errors);

  return sirets
    .map((siret) => `For siret ${siret} : ${errors[siret]} `)
    .join("\n");
};
