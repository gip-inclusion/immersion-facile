import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { PageHeader, type PageHeaderProps } from "./PageHeader";

const Component = PageHeader;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<PageHeaderProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { PageHeader } from "react-design-system";
\`\`\`
`;

export default {
  title: "PageHeader",
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
    title: "Page title",
  },
};
