import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  type AgencySubSection,
  ConventionSummary,
  type ConventionSummaryProperties,
} from "./ConventionSummary";

const Component = ConventionSummary;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ConventionSummaryProperties>> | undefined = {};

const componentDescription = `
Affiche un élément section ayant une bordure et contenant un titre.

\`\`\`tsx  
import { ConventionSummary } from "react-design-system";
\`\`\`
`;

const agencySubSectionForConventionSummaryStory: AgencySubSection = {
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

export default {
  title: "ConventionSummary",
  component: Component,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: componentDescription,
      },
    },
  },
} as Meta<typeof Component>;

export const Default: Story = {
  args: {
    conventionId: "Titre de la section",
    submittedAt: "",
    summary: [],
    agencySubSection: agencySubSectionForConventionSummaryStory,
  },
};
