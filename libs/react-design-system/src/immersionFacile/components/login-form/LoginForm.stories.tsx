import React from "react";
import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { LoginForm, LoginFormSectionProps } from "./LoginForm";

const Component = LoginForm;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<LoginFormSectionProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { LoginForm } from "react-design-system";
\`\`\`
`;

export default {
  title: "LoginForm",
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
    sections: [
      {
        title: "Titre de la section",
        description: "Lorem [...] elit ut.",
        authComponent: (
          <div>insérer ici le composant utilisé pour la connexion</div>
        ),
      },
    ],
  },
};
