import {
  type FormEstablishmentDto,
  type FormEstablishmentUserRight,
  type InclusionConnectDomainJwtPayload,
  type InclusionConnectJwtPayload,
  type SiretDto,
  addressDtoToString,
  errors,
  siretSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  SiretDto,
  FormEstablishmentDto,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = siretSchema;

  protected async _execute(
    siret: SiretDto,
    uow: UnitOfWork,
    jwtPayload?: InclusionConnectJwtPayload,
  ) {
    if (!jwtPayload) throw errors.user.noJwtProvided();

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    const currentUser = await uow.userRepository.getById(jwtPayload.userId);
    if (!currentUser) throw errors.user.notFound({ userId: jwtPayload.userId });

    if (
      establishmentAggregate.userRights.some(
        (right) => right.userId === currentUser.id,
      ) ||
      currentUser.isBackofficeAdmin
    )
      return this.#makeFormEstablishement(uow, establishmentAggregate);

    throw errors.user.unauthorized();
  }

  async #makeFormEstablishement(
    uow: UnitOfWork,
    establishmentAggregate: EstablishmentAggregate,
  ): Promise<FormEstablishmentDto> {
    return {
      siret: establishmentAggregate.establishment.siret,
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
      appellations:
        await uow.establishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
          establishmentAggregate.establishment.siret,
        ),
      userRights: await this.#makeFormUserRights(
        uow,
        establishmentAggregate.userRights,
      ),
      contactMode: establishmentAggregate.establishment.contactMode,
      maxContactsPerMonth:
        establishmentAggregate.establishment.maxContactsPerMonth,
      nextAvailabilityDate:
        establishmentAggregate.establishment.nextAvailabilityDate,
      searchableBy: establishmentAggregate.establishment.searchableBy,
    };
  }

  async #makeFormUserRights(
    uow: UnitOfWork,
    userRights: EstablishmentUserRight[],
  ): Promise<FormEstablishmentUserRight[]> {
    const users = await uow.userRepository.getByIds(
      userRights.map(({ userId }) => userId),
    );

    return userRights.map(({ role, userId, job, phone }) => {
      const user = users.find(({ id }) => id === userId);
      if (!user) throw errors.user.notFound({ userId });
      return role === "establishment-admin"
        ? {
            role,
            email: user.email,
            job,
            phone,
          }
        : { role, email: user.email, job, phone };
    });
  }
}
