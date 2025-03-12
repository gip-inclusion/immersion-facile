import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  SubmitConfirmationSection,
  type SubmitConfirmationSectionProps,
} from "./SubmitConfirmationSection";

const Component = SubmitConfirmationSection;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SubmitConfirmationSectionProps>> | undefined =
  {};

const componentDescription = `
\`\`\`tsx  
import { SubmitConfirmationSection } from "react-design-system";
\`\`\`
`;

export default {
  title: "SubmitConfirmationSection",
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
    idToCopy: "",
    onCopyButtonClick: () => {},
    copyButtonLabel: "Copier cet ID",
    copyButtonIsDisabled: false,
  },
};
