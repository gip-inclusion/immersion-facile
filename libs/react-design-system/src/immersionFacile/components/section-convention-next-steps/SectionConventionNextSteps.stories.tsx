import type { Meta, StoryObj } from "@storybook/react";
import { SectionConventionNextSteps } from "./SectionConventionNextSteps";

const Component = SectionConventionNextSteps;
type Story = StoryObj<typeof Component>;

const componentDescription = `
\`\`\`tsx  
import { SectionConventionNextSteps } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionConventionNextSteps",
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
