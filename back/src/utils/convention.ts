import {
  type AgencyDto,
  type ConventionAssessmentFields,
  type ConventionDto,
  type ConventionReadDto,
  type ConventionRole,
  type ConventionStatus,
  type Email,
  errors,
  type WithBannedEstablishmentInformations,
} from "shared";
import type { AssessmentEntity } from "../domains/convention/entities/AssessmentEntity";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import type { BannedEstablishment } from "../domains/establishment/ports/BannedEstablishmentRepository";
import {
  agencyDtoToConventionAgencyFields,
  agencyWithRightToAgencyDto,
} from "./agency";

export const conventionEmailsByRole =
  (convention: ConventionDto, agency: AgencyDto) =>
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
      counsellor: agency.counsellorEmails,
      validator: agency.validatorEmails,
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

  const bannedEstablishment: BannedEstablishment | undefined =
    await uow.bannedEstablishmentRepository.getBannedEstablishmentBySiret(
      conventionDto.siret,
    );

  const withBannedEstablishmentInformations: WithBannedEstablishmentInformations =
    bannedEstablishment
      ? {
          isEstablishmentBanned: true,
          establishmentBannishmentJustification:
            bannedEstablishment.establishmentBannishmentJustification,
        }
      : { isEstablishmentBanned: false };

  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
  const assessment = await uow.assessmentRepository.getByConventionId(
    conventionDto.id,
  );

  return {
    ...conventionDto,
    ...agencyDtoToConventionAgencyFields(
      agency,
      agency.refersToAgencyId
        ? ((await uow.agencyRepository.getById(agency.refersToAgencyId)) ??
            null)
        : null,
    ),
    ...assesmentEntityToConventionAssessmentFields(assessment),
    ...withBannedEstablishmentInformations,
  };
};

export const assesmentEntityToConventionAssessmentFields = (
  assessmentEntity: AssessmentEntity | undefined,
): ConventionAssessmentFields => {
  if (!assessmentEntity) return { assessment: null };

  return assessmentEntity.status === "COMPLETED" ||
    assessmentEntity.status === "PARTIALLY_COMPLETED" ||
    assessmentEntity.status === "DID_NOT_SHOW"
    ? {
        assessment: {
          status: assessmentEntity.status,
          endedWithAJob: assessmentEntity.endedWithAJob,
          signedAt: assessmentEntity.signedAt ?? null,
          createdAt: assessmentEntity.createdAt,
        },
      }
    : {
        assessment: {
          status: assessmentEntity.status,
          createdAt: assessmentEntity.createdAt,
        },
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
