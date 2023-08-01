import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { LinkHome, LinkHomeProps } from "./LinkHome";

const Component = LinkHome;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<LinkHomeProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { LinkHome } from "react-design-system";
\`\`\`
`;

export default {
  title: "LinkHome",
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
    children: "Exemple de lien vers une page",
    href: "https://immersion-facile.beta.gouv.fr/",
  },
};
