import {
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  SiretDto,
  addressDtoToString,
  siretSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/ports/UnitOfWork";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  SiretDto,
  FormEstablishmentDto,
  EstablishmentJwtPayload | BackOfficeJwtPayload
> {
  protected inputSchema = siretSchema;

  protected async _execute(
    siret: SiretDto,
    uow: UnitOfWork,
    jwtPayload?: EstablishmentJwtPayload | BackOfficeJwtPayload,
  ) {
    if (!jwtPayload) throw new ForbiddenError();
    const isValidEstablishmentJwtPayload =
      "siret" in jwtPayload && siret === jwtPayload.siret;
    const isValidBackOfficeJwtPayload =
      "role" in jwtPayload && jwtPayload.role === "backOffice";
    if (isValidBackOfficeJwtPayload || isValidEstablishmentJwtPayload)
      return this.#onValidJwt(uow, siret);
    throw new ForbiddenError();
  }

  async #onValidJwt(uow: UnitOfWork, siret: SiretDto) {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate)
      throw new BadRequestError(`No establishment found with siret ${siret}.`);

    if (!establishmentAggregate.contact)
      throw new BadRequestError("No contact ");

    const offersAsAppellationDto =
      await uow.establishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
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
      businessAddresses: establishmentAggregate.establishment.locations.map(
        (location) => ({
          id: location.id,
          rawAddress: addressDtoToString(location.address),
        }),
      ),
      isEngagedEnterprise: establishmentAggregate.establishment.isCommited,
      fitForDisabledWorkers:
        establishmentAggregate.establishment.fitForDisabledWorkers,
      naf: establishmentAggregate.establishment?.nafDto,
      appellations: offersAsAppellationDto,
      businessContact: establishmentAggregate.contact,
      maxContactsPerWeek:
        establishmentAggregate.establishment.maxContactsPerWeek,
      searchableBy: {
        jobSeekers: true,
        students: true,
      },
    };
    return retrievedForm;
  }
}
