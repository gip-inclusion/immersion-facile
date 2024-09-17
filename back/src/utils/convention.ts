import { AgencyDto, ConventionDto, Role, errors } from "shared";

export const conventionEmailsByRole = (
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => ({
  backOffice: errors.convention.roleHasNoMagicLink({ role: "backOffice" }),
  toReview: errors.convention.roleHasNoMagicLink({ role: "toReview" }),
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
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
  agencyAdmin: errors.convention.roleHasNoMagicLink({ role: "agencyAdmin" }),
  "establishment-representative": [
    convention.signatories.establishmentRepresentative.email,
  ],
  "establishment-tutor": [convention.establishmentTutor.email],
});

export const conventionEmailsByRoleForMagicLinkRenewal = (
  role: Role,
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => {
  return {
    ...conventionEmailsByRole(convention, agency),
    backOffice: errors.convention.roleHasNoMagicLink({ role: "backOffice" }),
    "establishment-tutor": errors.convention.unsupportedRoleRenewMagicLink({
      role,
    }),
  };
};
