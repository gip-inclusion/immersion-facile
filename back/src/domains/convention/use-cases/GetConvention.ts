import {
  type AgencyWithUsersRights,
  type ConventionDomainJwtPayload,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  errors,
  getConventionManageAllowedRoles,
  type UserId,
  withConventionIdSchema,
} from "shared";
import {
  isHashMatchConventionEmails,
  isHashMatchNotNotifiedCounsellorOrValidator,
  isHashMatchPeAdvisorEmail,
} from "../../../utils/emailHash";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

//TODO: Question de fond - GetConvention c'est une query sans ajout de data? Besoin d'un transactional usecase ?

export type GetConvention = ReturnType<typeof makeGetConvention>;

export const makeGetConvention = useCaseBuilder("GetConvention")
  .withInput(withConventionIdSchema)
  .withOutput<ConventionReadDto>()
  .withCurrentUser<ConventionRelatedJwtPayload>()
  .build(async ({ inputParams: { conventionId }, uow, currentUser }) => {
    throwErrorOnConventionIdMismatch({
      jwtPayload: currentUser,
      requestedConventionId: conventionId,
    });

    const convention =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!convention) throw errors.convention.notFound({ conventionId });

    return "emailHash" in currentUser
      ? onConventionDomainPayload({
          payload: currentUser,
          uow,
          convention,
        })
      : onConnectedUserPayload({
          userId: currentUser.userId,
          uow,
          convention,
        });
  });

const isEmailHashMatch = async ({
  payload: { emailHash, role },
  convention,
  agency,
  uow,
}: {
  payload: ConventionDomainJwtPayload;
  convention: ConventionReadDto;
  agency: AgencyWithUsersRights;
  uow: UnitOfWork;
}): Promise<boolean> => {
  const isEmailMatchingPeAdvisor = isHashMatchPeAdvisorEmail({
    beneficiary: convention.signatories.beneficiary,
    emailHash,
  });
  if (isEmailMatchingPeAdvisor) return true;

  const isMatchingConventionEmails = await isHashMatchConventionEmails({
    role,
    emailHash,
    convention,
  });
  if (isMatchingConventionEmails) return true;

  return await isHashMatchNotNotifiedCounsellorOrValidator({
    uow,
    emailHash,
    agency,
    role,
  });
};

async function onConnectedUserPayload({
  userId,
  convention,
  uow,
}: {
  userId: UserId;
  convention: ConventionReadDto;
  uow: UnitOfWork;
}): Promise<ConventionReadDto> {
  const user = await getUserWithRights(uow, userId);

  const roles = getConventionManageAllowedRoles(convention, user);
  if (roles.length) return convention;

  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      convention.siret,
    );

  const hasSomeEstablishmentRights = establishment?.userRights.some(
    (userRight) => userRight.userId === user.id,
  );

  if (hasSomeEstablishmentRights) return convention;

  throw errors.convention.forbiddenMissingRightsUserId({
    conventionId: convention.id,
    userId: user.id,
  });
}

const onConventionDomainPayload = async ({
  payload,
  convention,
  uow,
}: {
  payload: ConventionDomainJwtPayload;
  convention: ConventionReadDto;
  uow: UnitOfWork;
}): Promise<ConventionReadDto> => {
  const agency = await uow.agencyRepository.getById(convention.agencyId);
  if (!agency) throw errors.agency.notFound({ agencyId: convention.agencyId });

  const isMatchingEmailHash = await isEmailHashMatch({
    payload,
    convention,
    agency,
    uow,
  });

  if (!isMatchingEmailHash) {
    throw errors.convention.forbiddenMissingRightsEmailHash({
      conventionId: convention.id,
      emailHash: payload.emailHash,
      role: payload.role,
    });
  }

  return convention;
};
