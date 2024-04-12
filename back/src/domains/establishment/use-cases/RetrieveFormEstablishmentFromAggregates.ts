import {
  AppellationAndRomeDto,
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  InclusionConnectJwtPayload,
  SiretDto,
  addressDtoToString,
  siretSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  SiretDto,
  FormEstablishmentDto,
  EstablishmentJwtPayload | BackOfficeJwtPayload | InclusionConnectJwtPayload
> {
  protected inputSchema = siretSchema;

  protected async _execute(
    siret: SiretDto,
    uow: UnitOfWork,
    jwtPayload?:
      | EstablishmentJwtPayload
      | BackOfficeJwtPayload
      | InclusionConnectJwtPayload,
  ) {
    if (!jwtPayload) throw new ForbiddenError();
    const isValidEstablishmentJwtPayload =
      "siret" in jwtPayload && siret === jwtPayload.siret;
    const isValidBackOfficeJwtPayload =
      "role" in jwtPayload && jwtPayload.role === "backOffice";
    const isValidIcJwtPayload = "userId" in jwtPayload;
    if (
      isValidBackOfficeJwtPayload ||
      isValidEstablishmentJwtPayload ||
      isValidIcJwtPayload
    )
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

    return establishmentAggragateToFormEstablishement(
      establishmentAggregate,
      await uow.establishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
        siret,
      ),
    );
  }
}

export const establishmentAggragateToFormEstablishement = (
  establishmentAggregate: EstablishmentAggregate,
  appellations: AppellationAndRomeDto[],
): FormEstablishmentDto => {
  if (!establishmentAggregate.contact) throw new BadRequestError("No contact ");
  return {
    siret: establishmentAggregate.establishment.siret,
    source: "immersion-facile",
    website: establishmentAggregate.establishment.website,
    additionalInformation:
      establishmentAggregate.establishment.additionalInformation,
    businessName: establishmentAggregate.establishment.name,
    businessNameCustomized: establishmentAggregate.establishment.customizedName,
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
    appellations,
    businessContact: establishmentAggregate.contact,
    maxContactsPerWeek: establishmentAggregate.establishment.maxContactsPerWeek,
    nextAvailabilityDate:
      establishmentAggregate.establishment.nextAvailabilityDate,
    searchableBy: {
      jobSeekers: true,
      students: true,
    },
  } satisfies FormEstablishmentDto;
};
