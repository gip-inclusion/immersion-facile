import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ConventionDocument,
  ConventionDocumentProperties,
} from "./ConventionDocument";

const Component = ConventionDocument;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ConventionDocumentProperties>> | undefined =
  {};

const componentDescription = `
Affiche un document de convention imprimable.

\`\`\`tsx  
import { ConventionDocument } from "react-design-system";
\`\`\`
`;

export default {
  title: "ConventionDocument",
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
    children: <div>&lt; insérer ici le contenu html de la convention &gt;</div>,
    title: "Insérer ici le titre de la convention",
  },
};
