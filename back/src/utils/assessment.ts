import {
  AgencyDto,
  ConventionDomainPayload,
  ConventionDto,
  Role,
  errors,
  isSomeEmailMatchingEmailHash,
} from "shared";

export const throwForbiddenIfNotAllowedForAssessments = (
  convention: ConventionDto,
  agency: AgencyDto,
  { emailHash, applicationId, role }: ConventionDomainPayload,
) => {
  if (convention.id !== applicationId)
    throw errors.assessment.conventionIdMismatch();

  const emailsOrError = assessmentEmailsByRole(convention, agency)[role];

  if (emailsOrError instanceof Error) throw emailsOrError;
  if (!isSomeEmailMatchingEmailHash(emailsOrError, emailHash))
    throw errors.assessment.forbidden();
};

const assessmentEmailsByRole = (
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => ({
  "back-office": errors.assessment.forbidden(),
  "to-review": errors.assessment.forbidden(),
  "agency-viewer": errors.assessment.forbidden(),
  beneficiary: errors.assessment.forbidden(),
  "beneficiary-current-employer": errors.assessment.forbidden(),
  "beneficiary-representative": errors.assessment.forbidden(),
  "agency-admin": errors.assessment.forbidden(),
  "establishment-representative": errors.assessment.forbidden(),
  "establishment-tutor": [convention.establishmentTutor.email],
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
});
