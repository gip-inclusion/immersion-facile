import { subMonths } from "date-fns";
import { castError, type SiretDto } from "shared";
import { z } from "zod";
import { createLogger } from "../../../utils/logger";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { SuggestEditEstablishment } from "./SuggestEditEstablishment";

const logger = createLogger(__filename);

const NB_MONTHS_BEFORE_SUGGEST = 6;

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, Error>;
};

export class SuggestEditEstablishmentsScript extends UseCase<void, Report> {
  protected inputSchema = z.void();

  readonly #uowPerformer: UnitOfWorkPerformer;

  readonly #suggestEditEstablishment: SuggestEditEstablishment;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    suggestEditEstablishment: SuggestEditEstablishment,
    timeGateway: TimeGateway,
  ) {
    super();

    this.#suggestEditEstablishment = suggestEditEstablishment;
    this.#timeGateway = timeGateway;
    this.#uowPerformer = uowPerformer;
  }

  protected async _execute() {
    logger.info({
      message:
        "[triggerSuggestEditFormEstablishmentEvery6Months] Script started.",
    });
    const since = subMonths(this.#timeGateway.now(), NB_MONTHS_BEFORE_SUGGEST);

    const siretsToContact = await this.#uowPerformer.perform(async (uow) =>
      uow.establishmentAggregateRepository.getSiretOfEstablishmentsToSuggestUpdate(
        since,
      ),
    );

    if (siretsToContact.length === 0)
      return { numberOfEstablishmentsToContact: 0 };

    logger.info({
      message: `[triggerSuggestEditFormEstablishmentEvery6Months] Found ${
        siretsToContact.length
      } establishments not updated since ${since} to contact, with siret : ${siretsToContact.join(
        ", ",
      )}`,
    });

    const errors: Record<SiretDto, Error> = {};

    await Promise.all(
      siretsToContact.map(async (siret) => {
        await this.#suggestEditEstablishment.execute(siret).catch((error) => {
          errors[siret] = castError(error);
        });
      }),
    );

    return {
      numberOfEstablishmentsToContact: siretsToContact.length,
      errors,
    };
  }
}
