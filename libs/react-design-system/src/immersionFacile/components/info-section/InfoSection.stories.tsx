import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { InfoSection, type InfoSectionProps } from "./InfoSection";

const Component = InfoSection;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<InfoSectionProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { InfoSection } from "react-design-system";
\`\`\`
`;

export default {
  title: "InfoSection",
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
    description: "Ceci est une section informative avec un fond gris clair.",
  },
};

export const WithRichContent: Story = {
  name: "With rich content",
  args: {
    description: (
      <div>
        <h3>Section title</h3>
        <p>This section can contain any React node as its description.</p>
      </div>
    ),
  },
};
