import { subMonths } from "date-fns";
import { castError, type SiretDto } from "shared";
import { createLogger } from "../../../utils/logger";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { SuggestEditEstablishment } from "./SuggestEditEstablishment";

const logger = createLogger(__filename);

const NB_MONTHS_BEFORE_SUGGEST = 6;

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, Error>;
};

export type SuggestEditEstablishmentsScript = ReturnType<
  typeof makeSuggestEditEstablishmentsScript
>;

export const makeSuggestEditEstablishmentsScript = useCaseBuilder(
  "SuggestEditEstablishmentsScript",
)
  .notTransactional()
  .withOutput<Report>()
  .withDeps<{
    suggestEditEstablishment: SuggestEditEstablishment;
    timeGateway: TimeGateway;
    uowPerformer: UnitOfWorkPerformer;
  }>()
  .build(async ({ deps }) => {
    logger.info({
      message:
        "[triggerSuggestEditFormEstablishmentEvery6Months] Script started.",
    });
    const since = subMonths(deps.timeGateway.now(), NB_MONTHS_BEFORE_SUGGEST);

    const siretsToContact = await deps.uowPerformer.perform(async (uow) =>
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
        await deps.suggestEditEstablishment.execute(siret).catch((error) => {
          errors[siret] = castError(error);
        });
      }),
    );

    return {
      numberOfEstablishmentsToContact: siretsToContact.length,
      errors,
    };
  });
