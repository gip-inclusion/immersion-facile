import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { linkPrefix } from ".";
import { Header, ImmersionPureHeaderProps } from "./Header";

const Component = Header;
const argTypes: Partial<ArgTypes<ImmersionPureHeaderProps>> | undefined = {};

export default {
  title: `${linkPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  tools: [
    {
      iconClassName: "fr-link fr-fi-lock-line",
      label: "Se déconnecter",
      callback: () => false,
    },
  ],
  navLinks: [
    {
      label: "Home",
      link: {
        href: "#item-1",
        onClick: () => false,
      },
    },
    {
      label: "Item actif",
      link: {
        href: "#item-2",
        onClick: () => false,
      },
      active: true,
    },
    {
      label: "Item",
      link: {
        href: "#item-3",
        onClick: () => false,
      },
    },
    {
      label: "Dernier item",
      link: {
        href: "#item-4",
        onClick: () => false,
      },
    },
  ],
};
