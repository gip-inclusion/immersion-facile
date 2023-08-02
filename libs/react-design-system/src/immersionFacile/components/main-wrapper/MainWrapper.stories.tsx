import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { MainWrapper, MainWrapperProps } from "./MainWrapper";

const Component = MainWrapper;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<MainWrapperProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { MainWrapper } from "react-design-system";
\`\`\`
`;

export default {
  title: "MainWrapper",
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
  name: "default",
  args: {
    layout: "default",
    children: <div>insérer ici le contenu du wrapper</div>,
  },
};

export const Boxed: Story = {
  name: "boxed",
  args: {
    layout: "boxed",
    children: <div>insérer ici le contenu du wrapper</div>,
  },
};

export const Fullscreen: Story = {
  name: "fullscreen",
  args: {
    layout: "fullscreen",
    children: <div>insérer ici le contenu du wrapper</div>,
  },
};
