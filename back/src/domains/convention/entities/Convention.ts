import { intersection, toPairs, uniq } from "ramda";
import {
  type AgencyDto,
  type AgencyId,
  type AgencyKind,
  type AgencyWithUsersRights,
  type ApiConsumer,
  type ConventionDomainPayload,
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type DateTimeIsoString,
  type FeatureFlags,
  ForbiddenError,
  type InclusionConnectDomainJwtPayload,
  type Role,
  type Signatories,
  type SignatoryRole,
  type UserWithRights,
  type WithConventionId,
  agencyModifierRoles,
  allSignatoryRoles,
  errors,
  isValidMobilePhone,
  signConventionDtoWithRole,
  statusTransitionConfigs,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { isHashMatchPeAdvisorEmail } from "../../../utils/emailHash";
import { isSomeEmailMatchingEmailHash } from "../../../utils/jwt";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";

export const throwIfTransitionNotAllowed = ({
  targetStatus,
  roles,
  conventionRead,
  hasAssessment,
}: {
  targetStatus: ConventionStatus;
  roles: Role[];
  conventionRead: ConventionReadDto;
  hasAssessment: boolean;
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

  if (targetStatus === "CANCELLED" && hasAssessment)
    throw errors.convention.notAllowedToCancelConventionWithAssessment();

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
  convention: ConventionDto;
}): Promise<void> => {
  if ("role" in jwtPayload) {
    if (jwtPayload.role === "back-office") return;
    if (!agencyModifierRoles.includes(jwtPayload.role as any))
      throw errors.convention.unsupportedRole({
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
        beneficiary: convention.signatories.beneficiary,
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

export const getLinkedAgencies = async (
  uow: UnitOfWork,
  convention: ConventionDto,
): Promise<{ agency: AgencyDto; refersToAgency: AgencyDto | null }> => {
  const agencyWithRights = await uow.agencyRepository.getById(
    convention.agencyId,
  );
  if (!agencyWithRights)
    throw errors.agency.notFound({ agencyId: convention.agencyId });

  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

  if (!agency.refersToAgencyId) return { agency, refersToAgency: null };

  const refersToAgency = await uow.agencyRepository.getById(
    agency.refersToAgencyId,
  );

  if (!refersToAgency)
    throw errors.agency.notFound({ agencyId: agency.refersToAgencyId });

  return {
    agency,
    refersToAgency: await agencyWithRightToAgencyDto(uow, refersToAgency),
  };
};

export const shouldBroadcastToFranceTravail = ({
  agency,
  featureFlags,
  refersToAgency,
}: {
  agency: AgencyDto;
  refersToAgency: AgencyDto | null;
  featureFlags: FeatureFlags;
}): boolean => {
  const isBroadcastToFranceTravailAllowedForKind = (agencyKind: AgencyKind) => {
    if (agency.kind === agencyKind) return true;
    if (refersToAgency && refersToAgency.kind === "pole-emploi") return true;
    return false;
  };

  if (isBroadcastToFranceTravailAllowedForKind("pole-emploi")) return true;

  if (
    featureFlags.enableBroadcastOfMissionLocaleToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("mission-locale")
  )
    return true;

  if (
    featureFlags.enableBroadcastOfConseilDepartementalToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("conseil-departemental")
  )
    return true;

  if (
    featureFlags.enableBroadcastOfCapEmploiToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("cap-emploi")
  )
    return true;

  return false;
};

const getRoleAndIcUser = async (
  jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
  uow: UnitOfWork,
  initialConvention: ConventionDto,
): Promise<{ role: Role; userWithRights: UserWithRights | undefined }> => {
  if ("role" in jwtPayload)
    return { role: jwtPayload.role, userWithRights: undefined };

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

  if (
    userWithRights.email !==
    initialConvention.signatories.establishmentRepresentative.email
  )
    throw new ForbiddenError(
      `User '${userWithRights.id}' is not the establishment representative for convention '${initialConvention.id}'`,
    );

  return {
    role: initialConvention.signatories.establishmentRepresentative.role,
    userWithRights,
  };
};

const isAllowedToSign = (role: Role): role is SignatoryRole =>
  allSignatoryRoles.includes(role as SignatoryRole);

export const signConvention = async ({
  uow,
  conventionId,
  jwtPayload,
  now,
}: WithConventionId & {
  uow: UnitOfWork;
  jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload;
  now: DateTimeIsoString;
}) => {
  const initialConventionRead =
    await uow.conventionQueries.getConventionById(conventionId);
  if (!initialConventionRead)
    throw errors.convention.notFound({ conventionId });

  const { role, userWithRights } = await getRoleAndIcUser(
    jwtPayload,
    uow,
    initialConventionRead,
  );

  if (!isAllowedToSign(role))
    throw errors.convention.roleNotAllowedToSign({ role });

  const signedConvention = signConventionDtoWithRole(
    initialConventionRead,
    role,
    now,
  );
  throwIfTransitionNotAllowed({
    roles: [role],
    targetStatus: signedConvention.status,
    conventionRead: initialConventionRead,
    hasAssessment: false,
  });
  const signedId = await uow.conventionRepository.update(signedConvention);
  if (!signedId)
    throw errors.convention.notFound({ conventionId: signedConvention.id });

  return {
    role,
    userWithRights,
    signedConvention,
  };
};
