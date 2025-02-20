import {
  AgencyId,
  AgencyRole,
  AllowedManageConventionAgencyRoles,
  ConventionId,
  ConventionRelatedJwtPayload,
  Role,
  SignatoryRole,
  allowedManageConventionAgencyRoles,
  conventionIdSchema,
  errors,
  signatorySchema,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";

type RemindSignatoriesParams = {
  conventionId: ConventionId;
  role: SignatoryRole;
};

const remindSignatoriesParamsSchema: z.Schema<RemindSignatoriesParams> =
  z.object({
    conventionId: conventionIdSchema,
    role: signatorySchema,
  });

export type RemindSignatories = ReturnType<typeof makeRemindSignatories>;

export const makeRemindSignatories = createTransactionalUseCase<
  RemindSignatoriesParams,
  void,
  ConventionRelatedJwtPayload
>(
  {
    name: "RemindSignatories",
    inputSchema: remindSignatoriesParamsSchema,
  },
  async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    if ("role" in jwtPayload) {
    }

    const convention = await uow.conventionRepository.getById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(convention.status)) {
      throw errors.convention.signReminderNotAllowedForStatus({
        status: convention.status,
      });
    }
  },
);

const getUserRoleForAgency = async ({
  uow,
  jwtPayload,
  agencyId,
  conventionId,
}: {
  jwtPayload: ConventionRelatedJwtPayload;
  uow: UnitOfWork;
  agencyId: AgencyId;
  conventionId: ConventionId;
}) => {
  const isAllowedToManageConventionAgencyRole = (
    role: Role,
  ): role is AllowedManageConventionAgencyRoles | Role => {
    return allowedManageConventionAgencyRoles.includes(role as any);
  };

  if ("role" in jwtPayload) {
    if (jwtPayload.applicationId !== conventionId)
      throw errors.convention.forbiddenMissingRights({ conventionId });

    if (!isAllowedToManageConventionAgencyRole(jwtPayload.role))
      throw errors.convention.unsupportedRoleSignReminder(jwtPayload.role);

    return [jwtPayload.role];
  }

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);
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

  return agencyRightOnAgency.roles;
};


