import { AppellationCode, SiretAndRomeDto, siretAndRomeSchema } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class convertRomeToAppellationForEstablishment extends TransactionalUseCase<
  SiretAndRomeDto,
  AppellationCode
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = siretAndRomeSchema;

  protected async _execute(
    { rome, siret }: SiretAndRomeDto,
    uow: UnitOfWork,
  ): Promise<AppellationCode> {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate)
      throw new NotFoundError(`establishment with siret ${siret} not found`);

    const firstOfferMatchingRome = establishmentAggregate.immersionOffers.find(
      ({ romeCode }) => romeCode === rome,
    );

    if (!firstOfferMatchingRome)
      throw new NotFoundError(
        `Offer with rome code ${rome} not found for establishment with siret ${siret}`,
      );

    return firstOfferMatchingRome.appellationCode;
  }
}
