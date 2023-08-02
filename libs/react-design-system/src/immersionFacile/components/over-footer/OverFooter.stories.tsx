import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { OverFooter, OverFooterCols, OverFooterProps } from "./OverFooter";

const Component = OverFooter;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<OverFooterProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { OverFooter } from "react-design-system";
\`\`\`
`;

const overFooterCols: OverFooterCols = [
  {
    title: "Le centre d'aide",
    subtitle:
      "Consultez notre FAQ, trouvez les réponses aux questions les plus fréquentes et contactez-nous si vous n'avez pas trouvé de réponse",
    iconTitle: "fr-icon-questionnaire-fill",
    link: {
      label: "Accédez à notre FAQ",
      url: "https://aide.immersion-facile.beta.gouv.fr/fr/",
    },
    id: "faq-link",
  },
  {
    title: "Rejoignez la communauté",
    subtitle:
      "Rejoignez la communauté d'Immersion Facilitée et suivez nos actualités.",
    iconTitle: "fr-icon-links-fill",
    link: {
      label: "Rejoignez-nous sur Linkedin",
      url: "https://www.linkedin.com/company/l-immersion-facilitee/",
    },
    id: "linkedin-link",
  },
];

export default {
  title: "OverFooter",
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
    cols: overFooterCols,
  },
};
