import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  SectionHighlight,
  type SectionHighlightProps,
} from "./SectionHighlight";

const Component = SectionHighlight;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SectionHighlightProps>> = {
  priority: {
    control: "select",
    options: ["info", "discrete"],
    description: "Visual emphasis: info (blue) or discrete (grey).",
  },
};

const componentDescription = `
\`\`\`tsx  
import { SectionHighlight } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionHighlight",
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

const defaultChildren = (
  <p>
    Ceci est une section mise en avant avec un fond distinct pour attirer
    l'attention sur son contenu.
  </p>
);

export const Default: Story = {
  args: {
    children: defaultChildren,
    priority: "info",
  },
};

export const PriorityInfo: Story = {
  name: "Priority: info",
  args: {
    children: defaultChildren,
    priority: "info",
  },
};

export const PriorityDiscrete: Story = {
  name: "Priority: discrete",
  args: {
    children: defaultChildren,
    priority: "discrete",
  },
};
