import type { SiretDto } from "shared";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeSaveNotificationAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SuggestEditEstablishment } from "../../domains/establishment/use-cases/SuggestEditEstablishment";
import { SuggestEditEstablishmentsScript } from "../../domains/establishment/use-cases/SuggestEditEstablishmentsScript";
import { handleCRONScript } from "../handleCRONScript";

const config = AppConfig.createFromEnv();

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, any>;
};

const startScript = async (): Promise<Report> => {
  const timeGateway = new RealTimeGateway();
  const uuidGenerator = new UuidV4Generator();
  const { uowPerformer } = createUowPerformer(
    config,
    createMakeProductionPgPool(config),
  );

  const suggestEditEstablishmentsScript = new SuggestEditEstablishmentsScript(
    uowPerformer,
    new SuggestEditEstablishment(
      uowPerformer,
      makeSaveNotificationAndRelatedEvent(uuidGenerator, timeGateway),
      config.immersionFacileBaseUrl,
    ),
    timeGateway,
  );
  return suggestEditEstablishmentsScript.execute();
};

export const triggerSuggestEditFormEstablishmentEvery6Months = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerSuggestEditFormEstablishmentEvery6Months",
    config,
    script: startScript,
    handleResults: ({ numberOfEstablishmentsToContact, errors = {} }) => {
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
    exitOnFinish,
  });
