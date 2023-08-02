import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { NPSForm, NPSFormProps } from "./NPSForm";

const Component = NPSForm;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<NPSFormProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { NPSForm } from "react-design-system";
\`\`\`
`;

export default {
  title: "NPSForm",
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
    conventionInfos: {
      id: "id-convention",
      role: "beneficiary",
      status: "convention-status",
    },
  },
};
