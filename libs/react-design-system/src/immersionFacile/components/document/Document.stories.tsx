import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ConventionDocumentProperties, Document } from "./Document";

const Component = Document;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ConventionDocumentProperties>> | undefined =
  {};

const componentDescription = `
Affiche un document de convention imprimable.

\`\`\`tsx  
import { Document } from "react-design-system";
\`\`\`
`;

export default {
  title: "Document",
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
    children: <div>&lt; insérer ici le contenu html du document &gt;</div>,
    title: "Insérer ici le titre du document",
  },
};
