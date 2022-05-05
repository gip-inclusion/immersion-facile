import { z } from "zod";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  void,
  FormEstablishmentDto,
  EstablishmentJwtPayload
> {
  inputSchema = z.void();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
    { siret }: EstablishmentJwtPayload,
  ) {
    const establishmentAggregate =
      await uow.establishmentAggregateRepo.getEstablishmentAggregateBySiret(
        siret,
      );

    if (
      !establishmentAggregate ||
      establishmentAggregate?.establishment?.dataSource !== "form"
    )
      throw new BadRequestError(
        `No establishment found with siret ${siret} and form data source. `,
      );

    if (!establishmentAggregate.contact)
      throw new BadRequestError("No contact ");

    const offersAsAppellationDto =
      await uow.establishmentAggregateRepo.getOffersAsAppelationDtoForFormEstablishment(
        siret,
      );

    const retrievedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile",
      businessName: establishmentAggregate.establishment.name,
      businessNameCustomized:
        establishmentAggregate.establishment.customizedName,
      businessAddress: establishmentAggregate.establishment.address,
      isEngagedEnterprise: establishmentAggregate.establishment.isCommited,
      naf: establishmentAggregate.establishment?.nafDto,
      appellations: offersAsAppellationDto,
      businessContact: establishmentAggregate.contact,
      isSearchable: establishmentAggregate.establishment.isSearchable,
    };
    return retrievedForm;
  }
}
