import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { SkipLinks, SkipLinksProps } from "./SkipLinks";

const Component = SkipLinks;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SkipLinksProps>> | undefined = {};

const componentDescription = `
Proposer des liens d'évitement qui apparaissent à la tabulation.

\`\`\`tsx  
import { SkipLinks } from "react-design-system";
\`\`\`
`;

export default {
  title: "SkipLinks",
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
    links: [
      {
        label: "Lien 1",
        anchor: "anchor-1",
      },
      {
        label: "Lien 2",
        anchor: "anchor-2",
      },
      {
        label: "Pied de page",
        anchor: "anchor-3",
      },
    ],
  },
};
