import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { Input, InputProperties } from "./Input";

const Component = Input;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<InputProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { Input } from "react-design-system";
\`\`\`
`;

export default {
  title: "Input",
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
    name: "Defaut name",
    type: "text",
    value: "Default value",
  },
};
