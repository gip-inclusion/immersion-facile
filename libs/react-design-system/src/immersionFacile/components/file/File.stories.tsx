import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { File, FileProperties } from "./File";

const Component = File;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<FileProperties>> | undefined = {};

const componentDescription = `
Affiche un label, un champ \`input\` de type \`file\` et éventuellement un message d'erreur.

\`\`\`tsx  
import { File } from "react-design-system";
\`\`\`
`;

export default {
  title: "File",
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
    errorMessage: "Voici un message d'erreur",
    hint: "Voici une indication",
    label: "Nom du champ",
  },
};
