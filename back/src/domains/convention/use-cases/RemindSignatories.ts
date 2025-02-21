import {
  AgencyId,
  ConventionId,
  ConventionRelatedJwtPayload,
  Role,
  SignatoryRole,
  conventionIdSchema,
  errors,
  signatorySchema,
  agencyModifierRoles,
  AgencyModifierRole,
  ConventionStatus,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";
import {intersection} from "ramda";

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
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionRepository.getById(
      inputParams.conventionId
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status);
    await throwErrorIfUserRightsNotEnough({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
    });

    console.log("end");
  }
);

const throwErrorOnConventionIdMismatch = ({
  requestedConventionId,
  jwtPayload,
}: {
  requestedConventionId: ConventionId;
  jwtPayload: ConventionRelatedJwtPayload;
}) => {
  if ("applicationId" in jwtPayload && requestedConventionId !== jwtPayload.applicationId)
    throw errors.convention.forbiddenMissingRights({
      conventionId: requestedConventionId,
    });
};

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(status)) {
    throw errors.convention.signReminderNotAllowedForStatus({
      status: status,
    });
  }
};

const throwErrorIfUserRightsNotEnough = async ({
  uow,
  jwtPayload,
  agencyId,
}: {
  jwtPayload: ConventionRelatedJwtPayload;
  uow: UnitOfWork;
  agencyId: AgencyId;
}) => {
  const role = await getUserRoleForAgency({ uow, jwtPayload, agencyId });
};

const getUserRoleForAgency = async ({
  uow,
  jwtPayload,
  agencyId,
}: {
  jwtPayload: ConventionRelatedJwtPayload;
  uow: UnitOfWork;
  agencyId: AgencyId;
}): Promise<Role[]> => {
  if ("role" in jwtPayload) {
    if (!agencyModifierRoles.includes(jwtPayload.role as any))
      throw errors.convention.unsupportedRoleSignReminder({
        role: jwtPayload.role as any,
      });

    return [jwtPayload.role];
  }

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);
  if (!userWithRights)
    throw errors.user.notFound({
      userId: jwtPayload.userId,
    });

  const agencyRightOnAgency = userWithRights.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === agencyId && intersection(agencyModifierRoles,agencyRight.roles).length > 0
  );

  if (!agencyRightOnAgency)
    throw errors.user.noRightsOnAgency({
      userId: userWithRights.id,
      agencyId: agencyId,
    });

  return agencyRightOnAgency.roles;
};
