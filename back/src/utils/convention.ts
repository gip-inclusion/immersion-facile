import {
  type ConventionDto,
  type ConventionReadDto,
  type ConventionStatus,
  type Email,
  errors,
  type Role,
} from "shared";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { agencyWithRightToAgencyDto } from "./agency";

export const conventionEmailsByRole = (
  convention: ConventionReadDto,
): Record<Role, Email[] | Error> => ({
  "back-office": errors.convention.roleHasNoMagicLink({ role: "back-office" }),
  "to-review": errors.convention.roleHasNoMagicLink({ role: "to-review" }),
  "agency-viewer": errors.convention.roleHasNoMagicLink({
    role: "agency-viewer",
  }),
  beneficiary: [convention.signatories.beneficiary.email],
  "beneficiary-current-employer": convention.signatories
    .beneficiaryCurrentEmployer
    ? [convention.signatories.beneficiaryCurrentEmployer.email]
    : errors.convention.missingActor({
        conventionId: convention.id,
        role: "beneficiary-current-employer",
      }),
  "beneficiary-representative": convention.signatories.beneficiaryRepresentative
    ? [convention.signatories.beneficiaryRepresentative.email]
    : errors.convention.missingActor({
        conventionId: convention.id,
        role: "beneficiary-representative",
      }),
  counsellor: convention.agencyCounsellorEmails,
  validator: convention.agencyValidatorEmails,
  "agency-admin": errors.convention.roleHasNoMagicLink({
    role: "agency-admin",
  }),
  "establishment-representative": [
    convention.signatories.establishmentRepresentative.email,
  ],
  "establishment-tutor": [convention.establishmentTutor.email],
  "establishment-admin": errors.convention.roleHasNoMagicLink({
    role: "establishment-admin",
  }),
  "establishment-contact": errors.convention.roleHasNoMagicLink({
    role: "establishment-contact",
  }),
});

export const conventionDtoToConventionReadDto = async (
  conventionDto: ConventionDto,
  uow: UnitOfWork,
): Promise<ConventionReadDto> => {
  const agencyWithRights = await uow.agencyRepository.getById(
    conventionDto.agencyId,
  );
  if (!agencyWithRights)
    throw errors.agency.notFound({ agencyId: conventionDto.agencyId });

  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

  const agencyRefersTo = agency.refersToAgencyId
    ? await uow.agencyRepository.getById(agency.refersToAgencyId)
    : undefined;

  return {
    ...conventionDto,
    agencyCounsellorEmails: agency.counsellorEmails,
    agencyValidatorEmails: agency.validatorEmails,
    agencyName: agency.name,
    agencyDepartment: agency.coveredDepartments.at(0) ?? "",
    agencySiret: agency.agencySiret,
    agencyKind: agency.kind,
    ...(agencyRefersTo ? { agencyRefersTo } : {}),
  };
};

export const throwErrorIfConventionStatusNotAllowed = (
  status: ConventionStatus,
  allowedStatuses: ConventionStatus[],
  errorToThrow: Error,
) => {
  if (!allowedStatuses.includes(status)) {
    throw errorToThrow;
  }
};
