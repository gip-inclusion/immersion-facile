import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ConventionSummary,
  ConventionSummaryProperties,
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
  },
};
