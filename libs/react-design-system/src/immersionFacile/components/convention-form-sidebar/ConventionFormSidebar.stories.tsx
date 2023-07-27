import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ConventionFormSidebar,
  ConventionFormSidebarProperties,
} from "./ConventionFormSidebar";

const Component = ConventionFormSidebar;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ConventionFormSidebarProperties>> | undefined =
  {};

const componentDescription = `
Sur un grand écran: affiche un élément html \`<aside>\` contenant un stepper, une description et éventuellement un footer.

\`\`\`tsx  
import { ConventionFormSidebar } from "react-design-system";
\`\`\`
`;

export default {
  title: "ConventionFormSidebar",
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
    currentStep: 1,
    sidebarContent: [
      {
        description: (
          <>
            <p>
              Vérifiez que votre structure d’accompagnement est disponible dans
              la liste ci-dessous.{" "}
              <strong>
                Si ce n’est pas le cas, contactez votre conseiller.
              </strong>
            </p>
          </>
        ),
        title: "Informations sur la structure d'accompagnement du candidat",
      },
      {
        description: <>description</>,
        title: "Autre étape",
      },
    ],
    sidebarFooter: <>Ce footer est optionnel</>,
  },
};
