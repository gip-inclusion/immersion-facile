import { toPairs } from "ramda";
import {
  type ArchivedConventionRequestDto,
  archivedConventionErrorMessage,
  type ConventionId,
} from "shared";
import { frontErrors } from "src/app/pages/error/front-errors";

export const archiveReasonContentMapping: Record<
  ArchivedConventionRequestDto["reason"],
  string
> = {
  legalDispute: "Contentieux juridique",
  other: "Autre",
  rpeAdvisorAccessToBeneficiaryHistory:
    "Demande d'accès d'un conseiller du Réseau pour l'emploi (RPE) sur l'historique d'une personne",
  urssafOrInspectionControl: "Contrôle URSSAF ou inspection du travail",
};

export const archiveReasonOptions: {
  label: string;
  value: ArchivedConventionRequestDto["reason"];
}[] = toPairs(archiveReasonContentMapping).map(([key, value]) => ({
  label: value,
  value: key,
}));

export const throwIfArchivedConventionError = ({
  errorMessage,
  conventionId,
}: {
  errorMessage: string;
  conventionId: ConventionId | undefined;
}): void => {
  if (conventionId && errorMessage.includes(archivedConventionErrorMessage))
    throw frontErrors.convention.archived({ conventionId });
};
