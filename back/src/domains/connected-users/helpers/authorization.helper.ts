import {
  type AgencyId,
  type ConnectedUser,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  errors,
  type Role,
  type UserWithAdminRights,
} from "shared";
import { conventionEmailsByRole } from "../../../utils/convention";
import { isHashMatchPeAdvisorEmail } from "../../../utils/emailHash";
import { isSomeEmailMatchingEmailHash } from "../../../utils/jwt";
import { throwErrorOnConventionIdMismatch } from "../../convention/entities/Convention";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "./userRights.helper";

export const throwIfNotAdmin = (user: UserWithAdminRights | undefined) => {
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};

export const throwIfNotAgencyAdminOrBackofficeAdmin = (
  agencyId: AgencyId,
  currentUser?: ConnectedUser,
): void => {
  if (!currentUser) throw errors.user.unauthorized();
  if (currentUser.isBackofficeAdmin) return;

  const hasPermission = currentUser.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.id === agencyId &&
      agencyRight.roles.includes("agency-admin"),
  );

  if (!hasPermission) {
    throw errors.user.forbidden({ userId: currentUser.id });
  }
};

export const throwIfNotAuthorizedForRole = async ({
  uow,
  jwtPayload,
  authorizedRoles,
  errorToThrow,
  convention,
  isPeAdvisorAllowed,
}: {
  uow: UnitOfWork;
  jwtPayload: ConventionRelatedJwtPayload;
  authorizedRoles: Role[];
  errorToThrow: Error;
  convention: ConventionReadDto;
  isPeAdvisorAllowed: boolean;
}): Promise<void> => {
  if (!jwtPayload) throw errors.user.unauthorized();

  if ("userId" in jwtPayload) {
    const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

    if (
      userWithRights.isBackofficeAdmin &&
      authorizedRoles.includes("back-office")
    ) {
      return;
    }

    if (
      userWithRights.email ===
        convention.signatories.establishmentRepresentative.email &&
      authorizedRoles.includes("establishment-representative")
    ) {
      return;
    }

    if (
      userWithRights.email === convention.establishmentTutor.email &&
      authorizedRoles.includes("establishment-tutor")
    ) {
      return;
    }

    const hasAuthorizedAgencyRole = userWithRights.agencyRights.some(
      (agencyRight) =>
        agencyRight.agency.id === convention.agencyId &&
        agencyRight.roles.some((role) => authorizedRoles.includes(role)),
    );

    if (hasAuthorizedAgencyRole) {
      return;
    }

    const hasAuthorizedEstablishmentRole = userWithRights.establishments?.some(
      (establishmentRight) =>
        authorizedRoles.includes(establishmentRight.role) &&
        establishmentRight.siret === convention.siret,
    );

    if (hasAuthorizedEstablishmentRole) {
      return;
    }

    throw errorToThrow;
  }

  if ("applicationId" in jwtPayload) {
    const { emailHash, role } = jwtPayload;

    throwErrorOnConventionIdMismatch({
      requestedConventionId: convention.id,
      jwtPayload,
    });

    const emailMatchesPeAdvisoremail = isHashMatchPeAdvisorEmail({
      beneficiary: convention.signatories.beneficiary,
      emailHash: jwtPayload.emailHash,
    });

    if (isPeAdvisorAllowed && emailMatchesPeAdvisoremail) {
      return;
    }

    if (!authorizedRoles.includes(role)) {
      throw errorToThrow;
    }

    const emailsOrError = conventionEmailsByRole(convention)[role];

    if (emailsOrError instanceof Error) throw emailsOrError;

    if (!isSomeEmailMatchingEmailHash(emailsOrError, emailHash))
      throw errors.convention.emailNotLinkedToConvention(role);
  }
};
