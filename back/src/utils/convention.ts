import { AgencyDto, ConventionDto, Role, errors } from "shared";

export const conventionEmailsByRole = (
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => ({
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
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
  "agency-admin": errors.convention.roleHasNoMagicLink({
    role: "agency-admin",
  }),
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
    "back-office": errors.convention.roleHasNoMagicLink({
      role: "back-office",
    }),
    "establishment-tutor": errors.convention.unsupportedRoleRenewMagicLink({
      role,
    }),
  };
};
