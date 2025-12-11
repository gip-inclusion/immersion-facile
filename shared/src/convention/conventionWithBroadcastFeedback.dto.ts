import type { ConventionLastBroadcastFeedbackResponse } from "../broadcast/broadcastFeedback.dto";
import type {
  PaginationQueryParams,
  WithRequiredPagination,
} from "../pagination/pagination.dto";
import type { ConventionId, ConventionStatus } from "./convention.dto";
import type { WithFirstnameAndLastname } from "./convention.schema";

export type ConventionWithBroadcastFeedback = {
  id: ConventionId;
  status: ConventionStatus;
  beneficiary: WithFirstnameAndLastname;
  lastBroadcastFeedback: ConventionLastBroadcastFeedbackResponse;
};

export const functionalBroadcastFeedbackErrorMessage = [
  "Aucun dossier trouvé pour les critères d'identité transmis",
  "Aucune mission locale trouvée pour le numéro de SIRET fourni",
  "L'email transmis par le partenaire ne correspond pas à l'email renseigné dans le dossier du jeune",
  "Aucun employeur trouvé pour le code renseigné",
  "Le téléphone transmis par le partenaire ne correspond pas au téléphone renseigné dans le dossier du jeune",
  "Aucun métier trouvé pour le code ROME renseigné",
  "L'email et le téléphone transmis par le partenaires ne correspondent pas aux email et téléphone renseignés dans le dossier du jeune",
  "Plusieurs dossiers trouvés pour les critères transmis",
  "Identifiant National DE non trouvé",
  "Identifiant National DE trouvé mais écart sur la date de naissance",
  "Accord non signé pour ce type de structure d'accompagnement",
] as const;

export type FunctionalBroadcastFeedbackErrorMessage =
  (typeof functionalBroadcastFeedbackErrorMessage)[number];

export const isFunctionalBroadcastFeedbackError = (
  message: string,
): message is FunctionalBroadcastFeedbackErrorMessage =>
  functionalBroadcastFeedbackErrorMessage.includes(
    message as FunctionalBroadcastFeedbackErrorMessage,
  );

export type BroadcastErrorKind = "functional" | "technical";

export type ConventionsWithErroredBroadcastFeedbackFilters = {
  broadcastErrorKind?: BroadcastErrorKind;
  conventionStatus?: ConventionStatus[];
  search?: string;
};

export type FlatGetConventionsWithErroredBroadcastFeedbackParams =
  Required<PaginationQueryParams> &
    ConventionsWithErroredBroadcastFeedbackFilters;

export type GetConventionsWithErroredBroadcastFeedbackParams =
  WithRequiredPagination & {
    filters?: ConventionsWithErroredBroadcastFeedbackFilters;
  };

export const flatParamsToGetConventionsWithErroredBroadcastFeedbackParams = (
  flatParams: FlatGetConventionsWithErroredBroadcastFeedbackParams,
): GetConventionsWithErroredBroadcastFeedbackParams => {
  const {
    page,
    perPage,
    broadcastErrorKind,
    conventionStatus,
    search,
    ...rest
  } = flatParams;

  rest satisfies Record<string, never>;

  return {
    pagination: {
      page,
      perPage,
    },
    filters: {
      broadcastErrorKind,
      conventionStatus,
      search,
    },
  };
};
