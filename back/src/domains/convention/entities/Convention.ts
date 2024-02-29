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
} from "../../../config/helpers/httpErrors";
import { agencyMissingMessage } from "../../agency/ports/AgencyRepository";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
  conventionId,
}: {
  role: Role;
  targetStatus: ConventionStatus;
  conventionId: ConventionId;
}) => {
  const config = statusTransitionConfigs[targetStatus];
  if (!config.validRoles.includes(role))
    throw new ForbiddenError(
      `Role '${role}' is not allowed to go to status '${targetStatus}' for convention '${conventionId}'.`,
    );
};

export const throwIfTransitionNotAllowed = ({
  targetStatus,
  initialStatus,
  role,
  conventionId,
}: {
  targetStatus: ConventionStatus;
  initialStatus: ConventionStatus;
  role: Role;
  conventionId: ConventionId;
}) => {
  throwIfRoleNotAllowedToChangeStatus({ role, targetStatus, conventionId });
  throwIfStatusTransitionNotPossible({ initialStatus, targetStatus });
};

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
    throw new NotFoundError(conventionMissingMessage(conventionInPayload.id));
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
