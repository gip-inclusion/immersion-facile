import { ContactEstablishmentRequestDto } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { ContactEstablishmentPublicV1Dto } from "../../../adapters/primary/routers/DtoAndSchemas/v1/input/ContactEstablishmentPublicV1.dto";
import { contactEstablishmentPublicV1Schema } from "../../../adapters/primary/routers/DtoAndSchemas/v1/input/ContactEstablishmentPublicV1.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ConvertContactEstablishmentPublicV1ToDomain extends TransactionalUseCase<
  ContactEstablishmentPublicV1Dto,
  ContactEstablishmentRequestDto
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = contactEstablishmentPublicV1Schema;

  protected async _execute(
    { offer, ...contactRequest }: ContactEstablishmentPublicV1Dto,
    uow: UnitOfWork,
  ): Promise<ContactEstablishmentRequestDto> {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        contactRequest.siret,
      );
    if (!establishmentAggregate)
      throw new NotFoundError(
        `establishment with siret ${contactRequest.siret} not found`,
      );

    const firstOfferMatchingRome = establishmentAggregate.immersionOffers.find(
      ({ romeCode }) => offer.romeCode === romeCode,
    );

    if (!firstOfferMatchingRome)
      throw new NotFoundError(
        `Offer with rome code ${offer.romeCode} not found for establishment with siret ${contactRequest.siret}`,
      );

    if (contactRequest.contactMode === "EMAIL")
      return {
        ...contactRequest,
        potentialBeneficiaryPhone: "Numéro de téléphone non communiqué",
        immersionObjective: null,
        appellationCode: firstOfferMatchingRome.appellationCode,
      };

    return {
      ...contactRequest,
      appellationCode: firstOfferMatchingRome.appellationCode,
    };
  }
}
