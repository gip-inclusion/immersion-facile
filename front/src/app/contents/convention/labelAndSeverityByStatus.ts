import type { FrCxArg } from "@codegouvfr/react-dsfr";
import type { ConventionStatus } from "shared";

export const labelAndSeverityByStatus: Record<
  ConventionStatus,
  { label: { agency: string; beneficiary: string }; color: FrCxArg }
> = {
  ACCEPTED_BY_COUNSELLOR: {
    label: {
      beneficiary: "📄 En cours d'examen",
      agency: "📄 Demande éligible",
    },
    color: "fr-badge--purple-glycine",
  },
  ACCEPTED_BY_VALIDATOR: {
    label: {
      beneficiary: "✅ Demande validée",
      agency: "✅ Demande validée",
    },
    color: "fr-badge--green-emeraude",
  },
  CANCELLED: {
    label: {
      beneficiary: "❌ Convention annulée",
      agency: "❌ Convention annulée",
    },
    color: "fr-badge--error",
  },
  IN_REVIEW: {
    label: {
      beneficiary: "📄 En cours d'examen",
      agency: "📄 Demande à étudier",
    },
    color: "fr-badge--purple-glycine",
  },
  PARTIALLY_SIGNED: {
    label: {
      beneficiary: "✍ Partiellement signée",
      agency: "✍ Partiellement signée",
    },
    color: "fr-badge--purple-glycine",
  },
  READY_TO_SIGN: {
    label: {
      beneficiary: "✍ En cours de signature",
      agency: "✍ En cours de signature",
    },
    color: "fr-badge--purple-glycine",
  },
  REJECTED: {
    label: {
      beneficiary: "❌ Demande rejetée",
      agency: "❌ Demande rejetée",
    },
    color: "fr-badge--error",
  },
  DEPRECATED: {
    label: {
      beneficiary: "❌ Demande obsolète",
      agency: "❌ Demande obsolète",
    },
    color: "fr-badge--error",
  },
};
