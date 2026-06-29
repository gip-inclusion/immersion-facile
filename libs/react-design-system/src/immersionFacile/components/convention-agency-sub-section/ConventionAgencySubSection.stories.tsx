import type { Meta, StoryObj } from "@storybook/react";
import {
  type AgencySubSection,
  ConventionAgencySubSection,
} from "./ConventionAgencySubSection";

const agencySubSectionWithRefersToAgency: AgencySubSection = {
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

const agencySubSectionWithoutRefersToAgency: AgencySubSection = {
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

const agencySubSectionWithoutAgencyReferent: AgencySubSection = {
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

export default {
  title: "ConventionAgencySubSection",
  component: ConventionAgencySubSection,
} as Meta<typeof ConventionAgencySubSection>;

type Story = StoryObj<typeof ConventionAgencySubSection>;

export const WithRefersToAgency: Story = {
  args: agencySubSectionWithRefersToAgency,
};

export const WithoutRefersToAgency: Story = {
  args: agencySubSectionWithoutRefersToAgency,
};

export const WithoutAgencyReferent: Story = {
  args: agencySubSectionWithoutAgencyReferent,
};
