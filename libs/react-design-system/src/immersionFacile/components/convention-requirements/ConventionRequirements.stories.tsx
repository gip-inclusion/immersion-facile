import type { Meta, StoryObj } from "@storybook/react";
import { ConventionRequirements } from "./ConventionRequirements";

const Component = ConventionRequirements;
type Story = StoryObj<typeof Component>;

const componentDescription = `
\`\`\`tsx  
import { ConventionRequirements } from "react-design-system";
\`\`\`
`;

export default {
  title: "ConventionRequirements",
  component: Component,
  parameters: {
    docs: {
      description: {
        component: componentDescription,
      },
    },
  },
} as Meta<typeof Component>;

export const Default: Story = {};
