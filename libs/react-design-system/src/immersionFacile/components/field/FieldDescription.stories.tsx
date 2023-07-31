import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  FieldDescription,
  FieldDescriptionProperties,
} from "./FieldDescription";

const Component = FieldDescription;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<FieldDescriptionProperties>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { FieldDescription } from "react-design-system";
\`\`\`
`;

export default {
  title: "FieldDescription",
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
  args: {},
};
