import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { headerPrefix } from ".";
import { Header, ImmersionPureHeaderProps } from "./Header";

const Component = Header;
const argTypes: Partial<ArgTypes<ImmersionPureHeaderProps>> | undefined = {};

export default {
  title: `${headerPrefix}${Component.name}`,
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

      href: "#item-1",
      onClick: () => false,
      id: "im-header__link-1",
    },
    {
      label: "Item actif",
      href: "#item-2",
      onClick: () => false,
      active: true,
      id: "im-header__link-2",
    },
    {
      label: "Item",
      href: "#item-3",
      onClick: () => false,
      id: "im-header__link-3",
    },
    {
      label: "Dernier item",
      href: "#item-4",
      onClick: () => false,
      id: "im-header__link-4",
    },
  ],
};
