import {
  type ConnectedUser,
  type EstablishmentNameAndAdmins,
  errors,
  type SiretDto,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export type GetEstablishmentNameAndAdmins = ReturnType<
  typeof makeGetEstablishmentNameAndAdmins
>;

export const makeGetEstablishmentNameAndAdmins = createTransactionalUseCase<
  WithSiretDto,
  EstablishmentNameAndAdmins,
  ConnectedUser,
  void
>(
  {
    inputSchema: withSiretSchema,
    name: "UpdateMarketingEstablishmentContactList",
  },
  async ({
    inputParams: { siret },
    uow,
    currentUser,
  }): Promise<EstablishmentNameAndAdmins> => {
    const isUserAllowedToGetEstablishmentNameAndAdmins =
      currentUser.isBackofficeAdmin ||
      currentUser.proConnect?.siret === siret ||
      currentUser.establishments?.some((right) => right.siret === siret);

    if (isUserAllowedToGetEstablishmentNameAndAdmins)
      return await getEstablishmentNameAndAdmins({ uow, siret });

    throw errors.user.forbidden({ userId: currentUser.id });
  },
);

const getEstablishmentNameAndAdmins = async ({
  uow,
  siret,
}: {
  uow: UnitOfWork;
  siret: SiretDto;
}): Promise<EstablishmentNameAndAdmins> => {
  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      siret,
    );

  if (!establishment) throw errors.establishment.notFound({ siret });

  const adminsUsers = await uow.userRepository.getByIds(
    establishment.userRights
      .filter(({ role }) => role === "establishment-admin")
      .map(({ userId }) => userId),
  );

  return {
    name:
      establishment.establishment.customizedName ??
      establishment.establishment.name,
    adminEmails: adminsUsers.map(({ email }) => email),
  };
};
