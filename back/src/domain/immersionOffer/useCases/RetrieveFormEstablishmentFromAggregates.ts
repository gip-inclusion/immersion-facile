import { z } from "zod";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { FormEstablishmentDto } from "../../../shared/formEstablishment/FormEstablishment.dto";
import { EstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
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
    const establishment =
      await uow.establishmentAggregateRepo.getEstablishmentForSiret(siret);
    if (!establishment || establishment?.dataSource !== "form")
      throw new BadRequestError(
        `No establishment found with siret ${siret} and form data source. `,
      );

    const contact =
      await uow.establishmentAggregateRepo.getContactForEstablishmentSiret(
        siret,
      );
    if (!contact) throw new BadRequestError("No contact ");

    const offersAsAppellationDto =
      await uow.establishmentAggregateRepo.getOffersAsAppelationDtoForFormEstablishment(
        siret,
      );

    const retrievedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddress: establishment.address,
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment?.nafDto,
      appellations: offersAsAppellationDto.map((offerAsAppellationDto) => ({
        romeLabel: offerAsAppellationDto.romeLabel,
        romeCode: offerAsAppellationDto.romeCode,
        appellationCode: offerAsAppellationDto.appellationCode,
        appellationLabel: offerAsAppellationDto.appellationLabel,
      })),
      businessContact: contact,
      isSearchable: establishment.isSearchable,
    };
    return retrievedForm;
  }
}
