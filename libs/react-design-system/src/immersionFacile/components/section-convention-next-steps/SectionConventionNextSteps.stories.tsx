import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionConventionNextSteps } from "./SectionConventionNextSteps";

const Component = SectionConventionNextSteps;
type Story = StoryObj<typeof Component>;

const componentDescription = `
\`\`\`tsx  
import { SectionConventionNextSteps } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionConventionNextSteps",
  component: Component,
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
    nextSteps: [
      {
        illustration: "/assets/images/logo-if.svg",
        content: <p>1. Vérifiez votre boîte mail et votre dossier de spams.</p>,
      },
      {
        illustration: "/assets/images/logo-if.svg",
        content: <p>2. Signez électroniquement la demande de convention.</p>,
      },
      {
        illustration: "/assets/images/logo-if.svg",
        content: <p>3. Informez les autres signataires de la convention.</p>,
      },
    ],
  },
};
