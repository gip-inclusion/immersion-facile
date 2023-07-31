import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { TextArea, TextAreaProperties } from "./TextArea";

const Component = TextArea;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<TextAreaProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { TextArea } from "react-design-system";
\`\`\`
`;

export default {
  title: "TextArea",
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
    name: "Default",
    value: "Default Value",
  },
};
