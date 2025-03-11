import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  TextInputError,
  type TextInputErrorProperties,
} from "./TextInputError";

const Component = TextInputError;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<TextInputErrorProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { TextInputError } from "react-design-system";
\`\`\`
`;

export default {
  title: "TextInputError",
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
    errorMessage: "Error message.",
  },
};
