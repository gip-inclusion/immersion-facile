import type { FrCxArg } from "@codegouvfr/react-dsfr";
import type { ConventionStatus } from "shared";

export const labelAndSeverityByStatus: Record<
  ConventionStatus,
  { agencyLabel: string; beneficiaryLabel: string; color: FrCxArg }
> = {
  ACCEPTED_BY_COUNSELLOR: {
    beneficiaryLabel: "📄 En cours d'examen",
    agencyLabel: "📄 Demande éligible",
    color: "fr-badge--purple-glycine",
  },
  ACCEPTED_BY_VALIDATOR: {
    beneficiaryLabel: "✅ Demande validée",
    agencyLabel: "✅ Demande validée",
    color: "fr-badge--green-emeraude",
  },
  CANCELLED: {
    beneficiaryLabel: "❌ Convention annulée",
    agencyLabel: "❌ Convention annulée",
    color: "fr-badge--error",
  },
  IN_REVIEW: {
    beneficiaryLabel: "📄 En cours d'examen",
    agencyLabel: "📄 Demande à étudier",
    color: "fr-badge--purple-glycine",
  },
  PARTIALLY_SIGNED: {
    beneficiaryLabel: "✍ Partiellement signée",
    agencyLabel: "✍ Partiellement signée",
    color: "fr-badge--purple-glycine",
  },
  READY_TO_SIGN: {
    beneficiaryLabel: "✍ En cours de signature",
    agencyLabel: "✍ En cours de signature",
    color: "fr-badge--purple-glycine",
  },
  REJECTED: {
    beneficiaryLabel: "❌ Demande rejetée",
    agencyLabel: "❌ Demande rejetée",
    color: "fr-badge--error",
  },
  DEPRECATED: {
    beneficiaryLabel: "❌ Demande obsolète",
    agencyLabel: "❌ Demande obsolète",
    color: "fr-badge--error",
  },
};
