import { AgencyDto, ConventionDto, Role } from "shared";
import { BadRequestError } from "../config/helpers/httpErrors";

export const conventionEmailsByRole = (
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => ({
  backOffice: new BadRequestError("Le backoffice n'a pas de liens magiques."),
  beneficiary: [convention.signatories.beneficiary.email],
  "beneficiary-current-employer": convention.signatories
    .beneficiaryCurrentEmployer
    ? [convention.signatories.beneficiaryCurrentEmployer.email]
    : new BadRequestError(
        "There is no beneficiaryCurrentEmployer on convention.",
      ),
  "beneficiary-representative": convention.signatories.beneficiaryRepresentative
    ? [convention.signatories.beneficiaryRepresentative.email]
    : new BadRequestError(
        "There is no beneficiaryRepresentative on convention.",
      ),
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
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
    backOffice: new BadRequestError("Le backoffice n'a pas de liens magiques."),
    "establishment-tutor": new BadRequestError(
      `Le rôle ${role} n'est pas supporté pour le renouvellement de lien magique.`,
    ),
  };
};
