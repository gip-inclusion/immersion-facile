import { NumberType, getNumberType } from "libphonenumber-js";
import { parsePhoneNumber } from "libphonenumber-js/mobile";
import { intersection, toPairs } from "ramda";
import {
  AgencyId,
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  Role,
  SignatoryRole,
  agencyModifierRoles,
  conventionIdSchema,
  conventionSignatoryRoleBySignatoryKey,
  errors,
  isSomeEmailMatchingEmailHash,
  signatorySchema,
  signatoryTitleByRole,
} from "shared";
import { z } from "zod";
import { isHashMatchPeAdvisorEmail } from "../../../utils/emailHash";
import { createTransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
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
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status);
    await throwIfNotAllowedForUser({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
      convention,
    });

    throwErrorIfPhoneNumerNotValid({
      convention,
      signatoryRole: inputParams.role,
    });

    throwErrorIfSignatoryAlreadySigned({
      convention,
      signatoryRole: inputParams.role,
    });

    console.log("end");
  },
);

const throwErrorOnConventionIdMismatch = ({
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

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(status)) {
    throw errors.convention.signReminderNotAllowedForStatus({
      status: status,
    });
  }
};

const throwIfNotAllowedForUser = async ({
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
    if (!agencyModifierRoles.includes(jwtPayload.role as any))
      throw errors.convention.unsupportedRoleSignReminder({
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

    const users = await uow.userRepository.getByIds(
      userIdsWithRoleOnAgency,
      await makeProvider(uow),
    );

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

const throwErrorIfPhoneNumerNotValid = ({
  convention,
  signatoryRole,
}: { convention: ConventionReadDto; signatoryRole: SignatoryRole }) => {
  const signatory = conventionSignatoryRoleBySignatoryKey[signatoryRole];

  if (!convention.signatories[signatory]) {
    throw new Error();
  }

  const isValidMobilePhone =
    parsePhoneNumber(convention.signatories[signatory].phone).getType() ===
    "MOBILE";

  if (!isValidMobilePhone)
    throw errors.convention.invalidMobilePhoneNumber({
      conventionId: convention.id,
      signatoryRole,
    });
};

const throwErrorIfSignatoryAlreadySigned = ({
  convention,
  signatoryRole,
}: { convention: ConventionReadDto; signatoryRole: SignatoryRole }) => {
  const signatory = conventionSignatoryRoleBySignatoryKey[signatoryRole];

  if (convention.signatories[signatory]?.signedAt) {
    throw errors.convention.signatoryAlreadySigned({
      conventionId: convention.id,
      signatoryRole,
    });
  }
};
