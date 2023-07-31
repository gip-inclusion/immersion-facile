import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ImmersionTextField,
  ImmersionTextFieldProps,
} from "./ImmersionTextField";

const Component = ImmersionTextField;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ImmersionTextFieldProps>> | undefined = {};

const componentDescription = `
Affiche un label suivi un champ de saisie de type \`input\` ou \`textarea\` et éventuellement un message d'erreur.

\`\`\`tsx  
import { ImmersionTextField } from "react-design-system";
\`\`\`
`;

export default {
  title: "ImmersionTextField",
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
    description: "Default",
    error: "mon message d'erreur",
  },
};
