import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { HorizontalCard, type HorizontalCardProps } from "./HorizontalCard";

const Component = HorizontalCard;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<HorizontalCardProps>> | undefined = {};

const componentDescription = `
Afficher des lignes d'éléments.

\`\`\`tsx  
import { HorizontalCard } from "react-design-system";
\`\`\`
`;

export default {
  title: "HorizontalCard",
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
    title: "Un titre",
    titleAs: "h3",
    description: "Une description",
    buttonProps: {
      children: "Traiter",
      priority: "secondary",
      size: "medium",
      linkProps: {
        target: "_blank",
        href: "#",
        title: "Un lien",
      },
    },
  },
};
