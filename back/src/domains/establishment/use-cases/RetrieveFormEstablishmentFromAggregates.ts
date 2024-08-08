import {
  AppellationAndRomeDto,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  InclusionConnectJwtPayload,
  SiretDto,
  addressDtoToString,
  errors,
  siretSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  SiretDto,
  FormEstablishmentDto,
  EstablishmentJwtPayload | InclusionConnectJwtPayload
> {
  protected inputSchema = siretSchema;

  protected async _execute(
    siret: SiretDto,
    uow: UnitOfWork,
    jwtPayload?: EstablishmentJwtPayload | InclusionConnectJwtPayload,
  ) {
    if (!jwtPayload) throw errors.user.noJwtProvided();
    const isValidEstablishmentJwtPayload =
      "siret" in jwtPayload && siret === jwtPayload.siret;

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    if (isValidEstablishmentJwtPayload)
      return this.#onValidJwt(uow, establishmentAggregate);

    const isValidIcJwtPayload = "userId" in jwtPayload;
    if (isValidIcJwtPayload) {
      const currentUser = await uow.userRepository.getById(jwtPayload.userId);
      if (!currentUser)
        throw errors.user.notFound({ userId: jwtPayload.userId });

      if (
        currentUser.establishments?.some(
          ({ siret }) => siret === establishmentAggregate.establishment.siret,
        ) ||
        currentUser.isBackofficeAdmin
      )
        return this.#onValidJwt(uow, establishmentAggregate);
    }

    throw errors.user.unauthorized();
  }

  async #onValidJwt(
    uow: UnitOfWork,
    establishmentAggregate: EstablishmentAggregate,
  ) {
    return establishmentAggregateToFormEstablishement(
      establishmentAggregate,
      await uow.establishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
        establishmentAggregate.establishment.siret,
      ),
    );
  }
}

export const establishmentAggregateToFormEstablishement = (
  establishmentAggregate: EstablishmentAggregate,
  appellations: AppellationAndRomeDto[],
): FormEstablishmentDto =>
  ({
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
    maxContactsPerMonth:
      establishmentAggregate.establishment.maxContactsPerMonth,
    nextAvailabilityDate:
      establishmentAggregate.establishment.nextAvailabilityDate,
    searchableBy: establishmentAggregate.establishment.searchableBy,
  }) satisfies FormEstablishmentDto;
