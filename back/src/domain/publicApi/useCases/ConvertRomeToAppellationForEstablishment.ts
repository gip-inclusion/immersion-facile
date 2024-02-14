import { AppellationCode, SiretAndRomeDto, siretAndRomeSchema } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/ports/UnitOfWork";

export class ConvertRomeToAppellationForEstablishment extends TransactionalUseCase<
  SiretAndRomeDto,
  AppellationCode
> {
  protected inputSchema = siretAndRomeSchema;

  protected async _execute(
    { rome, siret }: SiretAndRomeDto,
    uow: UnitOfWork,
  ): Promise<AppellationCode> {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate)
      throw new NotFoundError(
        `No offer found for siret ${siret} and rome ${rome}`,
      );

    const firstOfferMatchingRome = establishmentAggregate.offers.find(
      ({ romeCode }) => romeCode === rome,
    );

    if (!firstOfferMatchingRome)
      throw new NotFoundError(
        `Offer with rome code ${rome} not found for establishment with siret ${siret}`,
      );

    return firstOfferMatchingRome.appellationCode;
  }
}
