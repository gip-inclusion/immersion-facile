import type { Meta, StoryObj } from "@storybook/react";
import { SectionAccordion } from "./SectionAccordion";

const Component = SectionAccordion;
type Story = StoryObj<typeof Component>;

const componentDescription = `
\`\`\`tsx  
import { SectionAccordion } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionAccordion",
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
