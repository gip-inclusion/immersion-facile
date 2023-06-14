import {
  AgencyDto,
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
import { ConventionRepository } from "../ports/ConventionRepository";

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

export const makeGetStoredConventionOrThrowIfNotAllowed =
  (conventionRepository: ConventionRepository) =>
  async (
    targetStatus: ConventionStatus,
    role: Role,
    applicationId: ConventionId,
  ): Promise<ConventionDto> => {
    throwIfRoleNotAllowedToChangeStatus({
      role,
      targetStatus,
    });

    const convention = await conventionRepository.getById(applicationId);
    if (!convention) throw new NotFoundError(applicationId);

    throwIfStatusTransitionNotPossible({
      initialStatus: convention.status,
      targetStatus,
    });

    return convention;
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
    throw new NotFoundError(conventionMissingMessage(conventionEvent));
  const agency = (
    await uow.agencyRepository.getByIds([convention.agencyId])
  ).at(0);
  if (!agency) throw new NotFoundError(agencyMissingMessage(convention));
  return { agency, convention };
}

export const conventionMissingMessage = (convention: ConventionDto): string =>
  `Convention with id '${convention.id}' missing.`;
export const agencyMissingMessage = (convention: ConventionDto): string =>
  `Agency with id '${convention.agencyId}' missing.`;
