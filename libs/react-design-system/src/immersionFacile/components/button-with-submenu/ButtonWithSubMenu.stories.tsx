import type { ArgTypes, Meta, StoryObj } from "@storybook/react";

import {
  ButtonWithSubMenu,
  type ButtonWithSubMenuProps,
} from "./ButtonWithSubMenu";

const Component = ButtonWithSubMenu;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ButtonWithSubMenuProps>> | undefined = {};

const componentDescription = `
Afficher un bouton avec un menu déroulant de boutons

\`\`\`tsx  
import { ButtonWithSubMenu } from "react-design-system";
\`\`\`
`;

export default {
  title: "ButtonWithSubMenu",
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

export const WithLinks: Story = {
  args: {
    id: "my-button-id",
    buttonLabel: "bouton avec menu déroulant",
    navItems: [
      {
        id: "link1",
        children: "Lien 1",
        linkProps: {
          href: "http://link1",
        },
      },
      {
        id: "link2",
        children: "Lien 2",
        linkProps: {
          href: "http://link2",
        },
      },
    ],
  },
};

export const WithButtons: Story = {
  args: {
    id: "my-button-id",
    buttonLabel: "bouton avec menu déroulant",
    navItems: [
      {
        id: "link1",
        children: "Bouton 1",
        onClick: () => {},
      },
      {
        id: "link2",
        children: "Bouton 2",
        onClick: () => {},
      },
    ],
  },
};
