import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { Label, LabelProperties } from "./Label";

const Component = Label;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<LabelProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { Label } from "react-design-system";
\`\`\`
`;

export default {
  title: "Label",
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
  args: { htmlFor: "default", label: "Default" },
};
