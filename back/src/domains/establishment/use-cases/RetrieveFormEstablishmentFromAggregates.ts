import {
  AppellationAndRomeDto,
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
  NotFoundError,
} from "../../../config/helpers/httpErrors";
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
    if (!jwtPayload) throw new ForbiddenError();
    const isValidEstablishmentJwtPayload =
      "siret" in jwtPayload && siret === jwtPayload.siret;

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate)
      throw new NotFoundError(`No establishment found with siret ${siret}.`);

    if (isValidEstablishmentJwtPayload)
      return this.#onValidJwt(uow, establishmentAggregate);

    const isValidIcJwtPayload = "userId" in jwtPayload;
    if (isValidIcJwtPayload) {
      const currentUser = await uow.inclusionConnectedUserRepository.getById(
        jwtPayload.userId,
      );
      if (!currentUser)
        throw new NotFoundError(`No user found with id ${jwtPayload.userId}`);
      if (
        currentUser.establishments?.some(
          ({ siret }) => siret === establishmentAggregate.establishment.siret,
        ) ||
        currentUser.isBackofficeAdmin
      )
        return this.#onValidJwt(uow, establishmentAggregate);
    }
    throw new ForbiddenError("User not allowed to access this establishment.");
  }

  async #onValidJwt(
    uow: UnitOfWork,
    establishmentAggregate: EstablishmentAggregate,
  ) {
    return establishmentAggragateToFormEstablishement(
      establishmentAggregate,
      await uow.establishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
        establishmentAggregate.establishment.siret,
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
