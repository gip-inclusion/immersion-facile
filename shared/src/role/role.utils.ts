import { intersection } from "ramda";
import {
  type AssessmentMode,
  type ConventionDto,
  type Signatories,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "..";
import {
  type AgencyModifierRole,
  type Role,
  type SignatoryRole,
  allowedRolesToAccessAssessment,
  allowedRolesToCreateAssessment,
} from "./role.dto";

export const signatoryTitleByRole: Record<SignatoryRole, string> = {
  beneficiary: "bénéficiaire",
  "beneficiary-representative": "représentant légal du bénéficiaire",
  "establishment-representative": "représentant de l'entreprise",
  "beneficiary-current-employer":
    "représentant de l'entreprise actuelle du candidat",
};

export const conventionSignatoryRoleBySignatoryKey: Record<
  SignatoryRole,
  keyof Signatories
> = {
  beneficiary: "beneficiary",
  "beneficiary-current-employer": "beneficiaryCurrentEmployer",
  "beneficiary-representative": "beneficiaryRepresentative",
  "establishment-representative": "establishmentRepresentative",
};

export const agencyModifierTitleByRole: Record<AgencyModifierRole, string> = {
  counsellor: "conseiller",
  validator: "valideur",
};

export const hasAllowedRoleOnAssessment = (
  userRolesOnConvention: Role[],
  mode: AssessmentMode,
  convention: ConventionDto,
): boolean => {
  const hasAllowedRoleToCreateAssessment =
    isEstablishmentTutorIsEstablishmentRepresentative(convention)
      ? intersection(
          [...allowedRolesToCreateAssessment, "establishment-representative"],
          userRolesOnConvention,
        ).length > 0
      : intersection(allowedRolesToCreateAssessment, userRolesOnConvention)
          .length > 0;
  const hasAllowedRoleToAccessAssessment =
    intersection(allowedRolesToAccessAssessment, userRolesOnConvention).length >
    0;

  return (
    userRolesOnConvention.length > 0 &&
    ((mode === "CreateAssessment" && hasAllowedRoleToCreateAssessment) ||
      (mode === "GetAssessment" && hasAllowedRoleToAccessAssessment))
  );
};
