import { subMonths } from "date-fns";
import { z } from "zod";
import { SiretDto } from "shared";
import { createLogger } from "../../../utils/logger";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UseCase } from "../../core/UseCase";
import { SuggestEditEstablishment } from "./SuggestEditEstablishment";

const logger = createLogger(__filename);

const NB_MONTHS_BEFORE_SUGGEST = 6;

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, any>;
};

export class SuggestEditEstablishmentsScript extends UseCase<void, Report> {
  inputSchema = z.void();

  constructor(
    private uowPerformer: UnitOfWorkPerformer,
    private suggestEditEstablishment: SuggestEditEstablishment,
    private timeGateway: TimeGateway,
  ) {
    super();
  }

  protected async _execute() {
    logger.info(
      `[triggerSuggestEditFormEstablishmentEvery6Months] Script started.`,
    );
    const since = subMonths(this.timeGateway.now(), NB_MONTHS_BEFORE_SUGGEST);

    const siretsToContact = await this.uowPerformer.perform(async (uow) =>
      uow.establishmentAggregateRepository.getSiretOfEstablishmentsToSuggestUpdate(
        since,
      ),
    );

    if (siretsToContact.length === 0)
      return { numberOfEstablishmentsToContact: 0 };

    logger.info(
      `[triggerSuggestEditFormEstablishmentEvery6Months] Found ${
        siretsToContact.length
      } establishments not updated since ${since} to contact, with siret : ${siretsToContact.join(
        ", ",
      )}`,
    );

    const errors: Record<SiretDto, any> = {};

    await Promise.all(
      siretsToContact.map(async (siret) => {
        await this.suggestEditEstablishment
          .execute(siret)
          .catch((error: any) => {
            errors[siret] = error;
          });
      }),
    );

    return {
      numberOfEstablishmentsToContact: siretsToContact.length,
      errors,
    };
  }
}
