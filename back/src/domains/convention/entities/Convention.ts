import { intersection, toPairs, uniq } from "ramda";
import {
  type AgencyDto,
  type AgencyId,
  type AgencyWithUsersRights,
  type ApiConsumer,
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  ForbiddenError,
  type Role,
  type Signatories,
  type SignatoryRole,
  agencyModifierRoles,
  errors,
  isSomeEmailMatchingEmailHash,
  isValidMobilePhone,
  statusTransitionConfigs,
} from "shared";
import { isHashMatchPeAdvisorEmail } from "../../../utils/emailHash";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";

export const throwIfTransitionNotAllowed = ({
  targetStatus,
  roles,
  conventionRead,
}: {
  targetStatus: ConventionStatus;
  roles: Role[];
  conventionRead: ConventionReadDto;
}) => {
  const config = statusTransitionConfigs[targetStatus];

  if (
    !oneOfTheRolesIsAllowed({
      allowedRoles: config.validRoles,
      rolesToValidate: roles,
    })
  )
    throw errors.convention.badRoleStatusChange({
      roles,
      status: targetStatus,
      conventionId: conventionRead.id,
    });

  if (!config.validInitialStatuses.includes(conventionRead.status))
    throw errors.convention.badStatusTransition({
      currentStatus: conventionRead.status,
      targetStatus,
    });

  if (config.refine) {
    const { isError, errorMessage } = config.refine(conventionRead);
    if (isError) throw new ForbiddenError(errorMessage);
  }
};

const oneOfTheRolesIsAllowed = ({
  allowedRoles,
  rolesToValidate,
}: { allowedRoles: Role[]; rolesToValidate: Role[] }) =>
  rolesToValidate.some((roleToValidate) =>
    allowedRoles.includes(roleToValidate),
  );

export const retrieveConventionWithAgency = async (
  uow: UnitOfWork,
  conventionId: ConventionId,
): Promise<{
  agency: AgencyWithUsersRights;
  convention: ConventionReadDto;
}> => {
  const convention =
    await uow.conventionQueries.getConventionById(conventionId);
  if (!convention)
    throw errors.convention.notFound({
      conventionId,
    });
  const agency = await uow.agencyRepository.getById(convention.agencyId);
  if (!agency) throw errors.agency.notFound({ agencyId: convention.agencyId });

  return {
    agency,
    convention,
  };
};

export const getAllConventionRecipientsEmail = (
  convention: ConventionDto,
  agency: AgencyDto,
): string[] => {
  const {
    beneficiary,
    beneficiaryRepresentative,
    establishmentRepresentative,
    beneficiaryCurrentEmployer,
  } = convention.signatories;
  const { validatorEmails, counsellorEmails } = agency;
  const { establishmentTutor } = convention;

  const recipientEmails = uniq([
    beneficiary.email,
    establishmentRepresentative.email,
    establishmentTutor.email,
    beneficiaryRepresentative?.email,
    beneficiaryCurrentEmployer?.email,
    ...counsellorEmails,
    ...validatorEmails,
  ]).filter((email): email is string => !!email);

  return recipientEmails;
};

const isAgencyIdInConsumerScope = (
  conventionRead: ConventionReadDto,
  apiConsumer: ApiConsumer,
): boolean => {
  const { scope } = apiConsumer.rights.convention;
  return scope.agencyIds
    ? scope.agencyIds.includes(conventionRead.agencyId) ||
        Boolean(
          conventionRead.agencyRefersTo &&
            scope.agencyIds.includes(conventionRead.agencyRefersTo.id),
        )
    : false;
};

const isAgencyKindInConsumerScope = (
  conventionRead: ConventionReadDto,
  apiConsumer: ApiConsumer,
): boolean => {
  const { scope } = apiConsumer.rights.convention;
  return scope.agencyKinds
    ? scope.agencyKinds.includes(conventionRead.agencyKind) ||
        Boolean(
          conventionRead.agencyRefersTo &&
            scope.agencyKinds.includes(conventionRead.agencyRefersTo.kind),
        )
    : false;
};

export const isConventionInScope = (
  conventionRead: ConventionReadDto,
  apiConsumer: ApiConsumer,
): boolean =>
  isAgencyIdInConsumerScope(conventionRead, apiConsumer) ||
  isAgencyKindInConsumerScope(conventionRead, apiConsumer);

export const throwIfNotAllowedForUser = async ({
  uow,
  jwtPayload,
  agencyId,
  convention,
}: {
  jwtPayload: ConventionRelatedJwtPayload;
  uow: UnitOfWork;
  agencyId: AgencyId;
  convention: ConventionReadDto;
}): Promise<void> => {
  if ("role" in jwtPayload) {
    if (jwtPayload.role === "back-office") return;
    if (!agencyModifierRoles.includes(jwtPayload.role as any))
      throw errors.convention.unsupportedRoleSendSignatureLink({
        role: jwtPayload.role as any,
      });

    const agency = await uow.agencyRepository.getById(agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId });

    const userIdsWithRoleOnAgency = toPairs(agency.usersRights)
      .filter(
        ([_, right]) =>
          right?.roles.includes("counsellor") ||
          right?.roles.includes("validator"),
      )
      .map(([id]) => id);

    const users = await uow.userRepository.getByIds(userIdsWithRoleOnAgency);

    if (
      !isHashMatchPeAdvisorEmail({
        convention,
        emailHash: jwtPayload.emailHash,
      }) &&
      !isSomeEmailMatchingEmailHash(
        users.map(({ email }) => email),
        jwtPayload.emailHash,
      )
    )
      throw errors.user.notEnoughRightOnAgency({
        agencyId,
      });

    return;
  }

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

  if (userWithRights.isBackofficeAdmin) return;

  if (!userWithRights)
    throw errors.user.notFound({
      userId: jwtPayload.userId,
    });

  const agencyRightOnAgency = userWithRights.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === agencyId,
  );

  if (!agencyRightOnAgency)
    throw errors.user.noRightsOnAgency({
      userId: userWithRights.id,
      agencyId: agencyId,
    });

  if (intersection(agencyModifierRoles, agencyRightOnAgency.roles).length === 0)
    throw errors.user.notEnoughRightOnAgency({
      agencyId,
      userId: userWithRights.id,
    });
};

export const throwErrorOnConventionIdMismatch = ({
  requestedConventionId,
  jwtPayload,
}: {
  requestedConventionId: ConventionId;
  jwtPayload: ConventionRelatedJwtPayload;
}) => {
  if (
    "applicationId" in jwtPayload &&
    requestedConventionId !== jwtPayload.applicationId
  )
    throw errors.convention.forbiddenMissingRights({
      conventionId: requestedConventionId,
    });
};

export const throwErrorIfSignatoryAlreadySigned = ({
  convention,
  signatoryRole,
  signatoryKey,
}: {
  convention: ConventionReadDto;
  signatoryRole: SignatoryRole;
  signatoryKey: keyof Signatories;
}) => {
  if (convention.signatories[signatoryKey]?.signedAt) {
    throw errors.convention.signatoryAlreadySigned({
      conventionId: convention.id,
      signatoryRole,
    });
  }
};

export const throwErrorIfPhoneNumberNotValid = ({
  convention,
  signatoryRole,
  signatoryKey,
}: {
  convention: ConventionReadDto;
  signatoryKey: keyof Signatories;
  signatoryRole: SignatoryRole;
}) => {
  if (!convention.signatories[signatoryKey])
    throw errors.convention.missingActor({
      conventionId: convention.id,
      role: signatoryRole,
    });

  if (!isValidMobilePhone(convention.signatories[signatoryKey]?.phone))
    throw errors.convention.invalidMobilePhoneNumber({
      conventionId: convention.id,
      signatoryRole,
    });
};
