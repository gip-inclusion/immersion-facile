import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { HeroHeader, HeroHeaderProps } from "./HeroHeader";

const Component = HeroHeader;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<HeroHeaderProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { HeroHeader } from "react-design-system";
\`\`\`
`;

export default {
  title: "HeroHeader",
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
    description:
      "Assurez le succès de votre projet professionnel en découvrant un métier en conditions réelles. Passez quelques jours en entreprise pour vérifier que ce métier vous plaît et vous convient. Profitez-en pour découvrir éventuellement votre futur employeur !",
    title:
      "L'immersion professionnelle, la meilleure façon de découvrir votre futur métier",
    type: "candidate",
    typeDisplayName: "Candidat",
  },
};
