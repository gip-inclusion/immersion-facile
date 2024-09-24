import {
  ConventionReadDto,
  ConventionStatus,
  Role,
  statusTransitionConfigs,
} from "shared";

export const isAllowedConventionTransition = (
  convention: ConventionReadDto,
  targetStatus: ConventionStatus,
  actingRoles: Role[],
): boolean => {
  const transitionConfig = statusTransitionConfigs[targetStatus];

  return (
    transitionConfig.validInitialStatuses.includes(convention.status) &&
    actingRoles.some((actingRole) =>
      transitionConfig.validRoles.includes(actingRole),
    ) &&
    (!transitionConfig.refine?.(convention).isError ?? true)
  );
};
