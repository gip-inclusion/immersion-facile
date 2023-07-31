import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { InputGroup, InputGroupProperties } from "./InputGroup";

const Component = InputGroup;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<InputGroupProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { InputGroup } from "react-design-system";
\`\`\`
`;

export default {
  title: "InputGroup",
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
    children: "Default",
  },
};
