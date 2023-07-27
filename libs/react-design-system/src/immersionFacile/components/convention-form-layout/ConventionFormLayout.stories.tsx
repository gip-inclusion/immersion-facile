import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ConventionFormLayout,
  ConventionFormLayoutProperties,
} from "./ConventionFormLayout";

const Component = ConventionFormLayout;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ConventionFormLayoutProperties>> | undefined =
  {};

const componentDescription = `
Ce layout affiche d'abord le contenu de l'attribut \`form\` puis \`sidebar\`.

\`\`\`tsx  
import { ConventionFormLayout } from "react-design-system";
\`\`\`
`;

export default {
  title: "ConventionFormLayout",
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
    form: <form>insérer ici le formulaire</form>,
    sidebar: (
      <aside>
        insérer ici un contenu annexe comme le bouton de soumission du
        formulaire par exemple
      </aside>
    ),
  },
};
