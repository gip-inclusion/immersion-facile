import React from "react";
import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { SimpleSection, SimpleSectionProps } from "./SimpleSection";

const Component = SimpleSection;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SimpleSectionProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { SimpleSection } from "react-design-system";
\`\`\`
`;

export default {
  title: "SimpleSection",
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
    children: (
      <>
        <h1>
          Quelqu'un a partagé une demande de convention d'immersion avec vous
        </h1>
        <p>
          Une entreprise ou un candidat a rempli ses informations dans le
          formulaire de demande de convention. Vous n'avez plus qu'à remplir vos
          informations et à valider le formulaire en quelques clics.
        </p>
      </>
    ),
    illustrationUrl: "assets/images/logo-if.svg",
    button: {
      label: "Continuer",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onClick: () => {},
    },
    link: {
      href: "#",
      label:
        "Ou continuer avec mes identifiants Pôle emploi (candidats inscrits à Pôle emploi)",
    },
  },
};
