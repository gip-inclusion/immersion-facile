import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { SectionStats, SectionStatsProps } from "./SectionStats";

const Component = SectionStats;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SectionStatsProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { SectionStats } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionStats",
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
    stats: [
      {
        badgeLabel: "Titre 1",
        value: "1",
        subtitle: "Lorem ipsum dolor sit amet",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed interdum vestibulum maximus.",
      },
      {
        badgeLabel: "Titre 2",
        value: "100%",
        subtitle: "Lorem ipsum dolor sit amet",
      },
      {
        badgeLabel: "Titre 3",
        value: "7",
        subtitle: "Lorem ipsum dolor sit amet",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed interdum vestibulum maximus.",
      },
    ],
  },
};
