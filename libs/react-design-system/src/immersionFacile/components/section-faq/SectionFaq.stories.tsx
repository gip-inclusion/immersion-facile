import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { SectionFaq, SectionFaqProps } from "./SectionFaq";

const Component = SectionFaq;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SectionFaqProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { SectionFaq } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionFaq",
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
    articles: [
      {
        title: "Un titre",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed interdum vestibulum maximus. Nullam ut mollis odio. Curabitur non fermentum felis. Morbi eleifend velit eget faucibus porttitor. Nam iaculis varius semper....`,
        url: "https://faux-lien.fr/",
      },
      {
        title: "Un autre titre",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed interdum vestibulum maximus. Nullam ut mollis odio. Curabitur non fermentum felis. Morbi eleifend velit eget faucibus porttitor. Nam iaculis varius semper....`,
        url: "https://faux-lien.fr/",
      },
    ],
  },
};
