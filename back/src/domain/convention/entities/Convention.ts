import { uniq } from "ramda";
import {
  AgencyDto,
  ApiConsumer,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  Role,
  statusTransitionConfigs,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork } from "../../core/ports/UnitOfWork";
import { agencyMissingMessage } from "../ports/AgencyRepository";

const throwIfStatusTransitionNotPossible = ({
  initialStatus,
  targetStatus,
}: {
  initialStatus: ConventionStatus;
  targetStatus: ConventionStatus;
}) => {
  const config = statusTransitionConfigs[targetStatus];
  if (!config.validInitialStatuses.includes(initialStatus))
    throw new BadRequestError(
      `Cannot go from status '${initialStatus}' to '${targetStatus}'`,
    );
};

const throwIfRoleNotAllowedToChangeStatus = ({
  role,
  targetStatus,
}: {
  role: Role;
  targetStatus: ConventionStatus;
}) => {
  const config = statusTransitionConfigs[targetStatus];
  if (!config.validRoles.includes(role))
    throw new ForbiddenError(
      `${role} is not allowed to go to status ${targetStatus}`,
    );
};

export const throwIfTransitionNotAllowed = ({
  targetStatus,
  initialStatus,
  role,
}: {
  targetStatus: ConventionStatus;
  initialStatus: ConventionStatus;
  role: Role;
}) => {
  throwIfRoleNotAllowedToChangeStatus({ role, targetStatus });
  throwIfStatusTransitionNotPossible({ initialStatus, targetStatus });
};

export async function retrieveConventionWithAgency(
  uow: UnitOfWork,
  conventionEvent: ConventionDto,
): Promise<{
  agency: AgencyDto;
  convention: ConventionReadDto;
}> {
  const convention = await uow.conventionQueries.getConventionById(
    conventionEvent.id,
  );
  if (!convention)
    throw new NotFoundError(conventionMissingMessage(conventionEvent.id));
  const agency = await uow.agencyRepository.getById(convention.agencyId);
  if (!agency)
    throw new NotFoundError(agencyMissingMessage(convention.agencyId));
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

export const conventionMissingMessage = (conventionId: ConventionId): string =>
  `Convention with id '${conventionId}' missing.`;

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
