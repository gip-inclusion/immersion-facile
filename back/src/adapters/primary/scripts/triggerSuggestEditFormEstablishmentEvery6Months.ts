import { Pool } from "pg";
import { SiretDto } from "shared";
import { makeGenerateJwtES256 } from "../../../domains/core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../../../domains/core/time-gateway/adapters/RealTimeGateway";
import { PgUowPerformer } from "../../../domains/core/unit-of-work/adapters/PgUowPerformer";
import { createPgUow } from "../../../domains/core/unit-of-work/adapters/createPgUow";
import { UuidV4Generator } from "../../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SuggestEditEstablishment } from "../../../domains/establishment/use-cases/SuggestEditEstablishment";
import { SuggestEditEstablishmentsScript } from "../../../domains/establishment/use-cases/SuggestEditEstablishmentsScript";
import { AppConfig } from "../config/appConfig";
import { makeGenerateEditFormEstablishmentUrl } from "../config/magicLinkUrl";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const config = AppConfig.createFromEnv();

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, any>;
};

const startScript = async (): Promise<Report> => {
  const timeGateway = new RealTimeGateway();
  const uuidGenerator = new UuidV4Generator();
  const pool = new Pool({
    connectionString: config.pgImmersionDbUrl,
  });
  const uowPerformer = new PgUowPerformer(pool, createPgUow);

  const numberOfDaysBeforeExpiration = 7;
  const expiresInSeconds = numberOfDaysBeforeExpiration * 24 * 60 * 60;

  const generateEditEstablishmentJwt = makeGenerateJwtES256<"establishment">(
    config.jwtPrivateKey,
    expiresInSeconds,
  );

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );

  const suggestEditEstablishment = new SuggestEditEstablishment(
    uowPerformer,
    saveNotificationAndRelatedEvent,
    timeGateway,
    makeGenerateEditFormEstablishmentUrl(config, generateEditEstablishmentJwt),
  );

  const suggestEditEstablishmentsScript = new SuggestEditEstablishmentsScript(
    uowPerformer,
    suggestEditEstablishment,
    timeGateway,
  );
  return suggestEditEstablishmentsScript.execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "triggerSuggestEditFormEstablishmentEvery6Months",
  config,
  startScript,
  ({ numberOfEstablishmentsToContact, errors = {} }) => {
    const nSiretFailed = Object.keys(errors).length;
    const nSiretSuccess = numberOfEstablishmentsToContact - nSiretFailed;
    const errorsAsString = Object.keys(errors)
      .map((siret) => `For siret ${siret} : ${errors[siret]} `)
      .join("\n");

    return [
      `Successfully sent to ${nSiretSuccess} sirets`,
      `Number of failures: ${nSiretFailed}`,
      ...(nSiretFailed > 0 ? [`Errors were: ${errorsAsString}`] : []),
    ].join("\n");
  },
);
