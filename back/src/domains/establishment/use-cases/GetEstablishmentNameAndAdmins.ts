import {
  type ConnectedUser,
  type EstablishmentNameAndAdmins,
  errors,
  type SiretDto,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetEstablishmentNameAndAdmins = ReturnType<
  typeof makeGetEstablishmentNameAndAdmins
>;

export const makeGetEstablishmentNameAndAdmins = useCaseBuilder(
  "UpdateMarketingEstablishmentContactList",
)
  .withInput<WithSiretDto>(withSiretSchema)
  .withOutput<EstablishmentNameAndAdmins>()
  .withCurrentUser<ConnectedUser>()
  .build(
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
