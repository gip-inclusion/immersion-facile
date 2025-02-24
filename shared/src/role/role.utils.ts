import { Signatories } from "..";
import { SignatoryRole } from "./role.dto";

export const signatoryTitleByRole: Record<SignatoryRole, string> = {
  beneficiary: "Le bénéficiaire",
  "beneficiary-representative": "Le représentant légal du bénéficiaire",
  "establishment-representative": "Le représentant de l'entreprise",
  "beneficiary-current-employer":
    "Le représentant de l'entreprise actuelle du candidat",
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
