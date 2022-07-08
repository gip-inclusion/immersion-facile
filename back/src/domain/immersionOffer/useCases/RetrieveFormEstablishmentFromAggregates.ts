import {
  BadRequestError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretDto, siretSchema } from "shared/src/siret";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  SiretDto,
  FormEstablishmentDto,
  EstablishmentJwtPayload
> {
  inputSchema = siretSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    siret: SiretDto,
    uow: UnitOfWork,
    { siret: siretFromJwt }: EstablishmentJwtPayload,
  ) {
    if (siret !== siretFromJwt) throw new ForbiddenError();

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
      website: establishmentAggregate.establishment.website,
      additionalInformation:
        establishmentAggregate.establishment.additionalInformation,
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
