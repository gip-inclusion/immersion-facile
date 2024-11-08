import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import React from "react";
import { CopyButton, CopyButtonProperties } from "./CopyButton";

const Component = CopyButton;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<CopyButtonProperties>> | undefined = {};

const componentDescription = `
Affiche un bouton qui met un texte dans le presse-papier.

\`\`\`tsx  
import { CopyButton } from "react-design-system";
\`\`\`
`;

export default {
  title: "CopyButton",
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

export const WithLabel: Story = {
  args: {
    label: "Copier",
    textToCopy: "texte copié",
    withIcon: false,
  },
};

export const WithIconButNoLabel: Story = {
  args: {
    textToCopy: "texte copié",
    withIcon: true,
  },
};

export const WithBorder: Story = {
  args: {
    textToCopy: "texte copié",
    withIcon: true,
    withBorder: true,
  },
};
