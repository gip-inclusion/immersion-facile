import { Meta, StoryObj } from "@storybook/react";
import { Loader } from "./Loader";

const Component = Loader;
type Story = StoryObj<typeof Component>;

const componentDescription = `
Affiche une icône de chargement et recouvre le contenu de la page de manière semi-transparente.

\`\`\`tsx  
import { Loader } from "react-design-system";
\`\`\`
`;

export default {
  title: "Loader",
  component: Component,
  parameters: {
    docs: {
      description: {
        component: componentDescription,
      },
    },
  },
} as Meta<typeof Component>;

export const Default: Story = {};
