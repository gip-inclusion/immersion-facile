import { ConventionStatus } from "shared";

export const labelAndSeverityByStatus: Record<
  ConventionStatus,
  { label: string; color: string }
> = {
  ACCEPTED_BY_COUNSELLOR: {
    label: "📄 Demande éligible",
    color: "fr-badge--purple-glycine",
  },
  ACCEPTED_BY_VALIDATOR: {
    label: "✅ Demande validée",
    color: "fr-badge--green-emeraude",
  },
  CANCELLED: {
    label: "❌ Convention annulée",
    color: "fr-badge--error",
  },
  DRAFT: {
    label: "📄 Brouillon",
    color: "fr-badge--info",
  },
  IN_REVIEW: {
    label: "📄 Demande à étudier",
    color: "fr-badge--purple-glycine",
  },
  PARTIALLY_SIGNED: {
    label: "✍ Partiellement signée",
    color: "fr-badge--purple-glycine",
  },
  READY_TO_SIGN: {
    label: "✍ En cours de signature",
    color: "fr-badge--purple-glycine",
  },
  REJECTED: {
    label: "❌ Demande rejetée",
    color: "fr-badge--error",
  },
  DEPRECATED: {
    label: "❌ Demande obsolète",
    color: "fr-badge--error",
  },
};
