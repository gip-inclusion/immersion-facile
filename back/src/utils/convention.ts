import {
  type ConventionDto,
  type ConventionReadDto,
  type ConventionRole,
  type ConventionStatus,
  type Email,
  errors,
} from "shared";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { agencyWithRightToAgencyDto } from "./agency";

export const conventionEmailsByRole =
  (convention: ConventionReadDto) =>
  (role: ConventionRole): Email[] => {
    const emailsByRole: Record<ConventionRole, Email[] | Error | undefined> = {
      beneficiary: [convention.signatories.beneficiary.email],
      "beneficiary-current-employer": convention.signatories
        .beneficiaryCurrentEmployer
        ? [convention.signatories.beneficiaryCurrentEmployer.email]
        : errors.convention.missingActor({
            conventionId: convention.id,
            role: "beneficiary-current-employer",
          }),
      "beneficiary-representative": convention.signatories
        .beneficiaryRepresentative
        ? [convention.signatories.beneficiaryRepresentative.email]
        : errors.convention.missingActor({
            conventionId: convention.id,
            role: "beneficiary-representative",
          }),
      counsellor: convention.agencyCounsellorEmails,
      validator: convention.agencyValidatorEmails,
      "establishment-representative": [
        convention.signatories.establishmentRepresentative.email,
      ],
      "establishment-tutor": [convention.establishmentTutor.email],
    };
    const emails = emailsByRole[role as ConventionRole];

    if (!emails) throw errors.convention.roleHasNoMagicLink({ role });
    if (emails instanceof Error) throw emails;
    return emails;
  };

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
