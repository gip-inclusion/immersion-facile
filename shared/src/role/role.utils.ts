import { AgencyModifierRole, SignatoryRole } from "./role.dto";

export const signatoryTitleByRole: Record<SignatoryRole, string> = {
  beneficiary: "bénéficiaire",
  "beneficiary-representative": "représentant légal du bénéficiaire",
  "establishment-representative": "représentant de l'entreprise",
  "beneficiary-current-employer":
    "Le représentant de l'entreprise actuelle du candidat",
};

export const agencyModifierTitleByRole: Record<AgencyModifierRole, string> = {
  counsellor: "conseiller",
  validator: "valideur",
};
