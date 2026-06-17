import type { AgencySubSection } from "./ConventionAgencySubSection";

export const agencySubSectionWithRefersToAgency: AgencySubSection = {
  agencyReferent: { fullName: "" },
  refersToAgency: {
    structureName: "INSERSUD",
    representedBy: "Prénom Nom du pré-validateur",
    statusBadge: {
      children: "Pré-validée - Le 12/09/2024",
      severity: "success",
    },
  },
  agency: {
    title: "Prescripteur lié",
    structureName: "Agence France Travail AMBERIEU EN BUGEY",
    representedBy: "Prénom Nom du validateur",
  },
};

export const agencySubSectionWithoutRefersToAgency: AgencySubSection = {
  agencyReferent: { fullName: "Ali BABA" },
  agency: {
    title: "Prescripteur",
    structureName: "PE Paris",
    representedBy: "Jean VALIDATEUR",
    statusBadge: {
      children: "Validée - Le 12/06/2025",
      severity: "success",
    },
  },
};

export const agencySubSectionWithoutAgencyReferent: AgencySubSection = {
  agencyReferent: { fullName: "" },
  agency: {
    title: "Prescripteur",
    structureName: "PE Paris",
    statusBadge: {
      children: "Validation en attente",
      severity: "warning",
    },
  },
};

export const agencySubSectionForConventionSummaryStory: AgencySubSection = {
  agencyReferent: { fullName: "Martin DUBOIS" },
  refersToAgency: {
    structureName: "INSERSUD",
    statusBadge: {
      children: "Pré-validation en attente",
      severity: "warning",
    },
  },
  agency: {
    title: "Prescripteur lié",
    structureName: "Agence France Travail AMBERIEU EN BUGEY",
    statusBadge: {
      children: "Validation en attente",
      severity: "warning",
    },
  },
};
