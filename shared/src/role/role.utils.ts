import { SignatoryRole } from "./role.dto";

export const signatoryTitleByRole: Record<SignatoryRole, string> = {
  beneficiary: "Le bénéficiaire",
  "beneficiary-representative": "Le représentant légal du bénéficiaire",
  "establishment-representative": "Le représentant de l'entreprise",
  "beneficiary-current-employer":
    "Le représentant de l'entreprise actuelle du candidat",
};
