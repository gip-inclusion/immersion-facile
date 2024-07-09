import { uniq } from "ramda";
import {
  AgencyDto,
  ApiConsumer,
  ConventionDto,
  ConventionReadDto,
  ConventionStatus,
  Role,
  errorMessages,
  statusTransitionConfigs,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
    throw new ForbiddenError(
      errorMessages.convention.badRoleStatusChange({
        roles,
        status: targetStatus,
        conventionId: conventionRead.id,
      }),
    );

  if (!config.validInitialStatuses.includes(conventionRead.status))
    throw new BadRequestError(
      errorMessages.convention.badStatusTransition({
        currentStatus: conventionRead.status,
        targetStatus,
      }),
    );

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

export async function retrieveConventionWithAgency(
  uow: UnitOfWork,
  conventionInPayload: ConventionDto,
): Promise<{
  agency: AgencyDto;
  convention: ConventionReadDto;
}> {
  const convention = await uow.conventionQueries.getConventionById(
    conventionInPayload.id,
  );
  if (!convention)
    throw new NotFoundError(
      errorMessages.convention.notFound({
        conventionId: conventionInPayload.id,
      }),
    );
  const agency = await uow.agencyRepository.getById(convention.agencyId);
  if (!agency)
    throw new NotFoundError(
      errorMessages.agency.notFound({ agencyId: convention.agencyId }),
    );
  return { agency, convention };
}

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
    ? scope.agencyIds.includes(conventionRead.agencyId)
    : false;
};

const isAgencyKindInConsumerScope = (
  conventionRead: ConventionReadDto,
  apiConsumer: ApiConsumer,
): boolean => {
  const { scope } = apiConsumer.rights.convention;
  return scope.agencyKinds
    ? scope.agencyKinds.includes(conventionRead.agencyKind)
    : false;
};

export const isConventionInScope = (
  conventionRead: ConventionReadDto,
  apiConsumer: ApiConsumer,
): boolean =>
  isAgencyIdInConsumerScope(conventionRead, apiConsumer) ||
  isAgencyKindInConsumerScope(conventionRead, apiConsumer);
