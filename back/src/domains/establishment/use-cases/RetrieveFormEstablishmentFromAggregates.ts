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
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  EstablishmentAdminRight,
  EstablishmentAggregate,
} from "../entities/EstablishmentEntity";

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
      const provider = await makeProvider(uow);
      const currentUser = await uow.userRepository.getById(
        jwtPayload.userId,
        provider,
      );
      if (!currentUser)
        throw errors.user.notFound({ userId: jwtPayload.userId });

      if (
        establishmentAggregate.userRights.some(
          (right) => right.userId === currentUser.id,
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
      uow,
    );
  }
}

export const establishmentAggregateToFormEstablishement = async (
  establishmentAggregate: EstablishmentAggregate,
  appellations: AppellationAndRomeDto[],
  uow: UnitOfWork,
): Promise<FormEstablishmentDto> => {
  const provider = await makeProvider(uow);
  const firstAdminRight = establishmentAggregate.userRights.find(
    (right): right is EstablishmentAdminRight =>
      right.role === "establishment-admin",
  );

  if (!firstAdminRight)
    throw errors.establishment.adminNotFound({
      siret: establishmentAggregate.establishment.siret,
    });

  const firstEstablishmentAdmin = await uow.userRepository.getById(
    firstAdminRight.userId,
    provider,
  );

  if (!firstEstablishmentAdmin)
    throw errors.user.notFound({ userId: firstAdminRight.userId });

  const establishmentContacts = await uow.userRepository.getByIds(
    establishmentAggregate.userRights
      .filter(({ role }) => role === "establishment-contact")
      .map(({ userId }) => userId),
    provider,
  );

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
    businessContact: {
      contactMethod: establishmentAggregate.establishment.contactMethod,
      firstName: firstEstablishmentAdmin.firstName,
      lastName: firstEstablishmentAdmin.lastName,
      email: firstEstablishmentAdmin.email,
      job: firstAdminRight.job,
      phone: firstAdminRight.phone,
      copyEmails: establishmentContacts.map(({ email }) => email),
    },
    maxContactsPerMonth:
      establishmentAggregate.establishment.maxContactsPerMonth,
    nextAvailabilityDate:
      establishmentAggregate.establishment.nextAvailabilityDate,
    searchableBy: establishmentAggregate.establishment.searchableBy,
  } satisfies FormEstablishmentDto;
};
