import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { NavLink, tabLinksPrefix } from ".";
import { NavWrapper, TabLinks } from "./TabLinks";

const Component = TabLinks;
const argTypes: Partial<ArgTypes> | undefined = {}; // <TabsProperties>

export default {
  title: `${tabLinksPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const navLinks: NavLink[] = [
  {
    label: "My first tab",
    href: "#1",
    onClick: (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log("clicked firstTab");
    },
    id: "im-tab-links__link-1",
  },
  {
    label: "My second tab",
    href: "#2",
    onClick: (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log("clicked second Tab");
    },
    id: "im-tab-links__link-2",
  },
  {
    label: "My third tab",

    href: "#3",
    onClick: (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log("clicked third Tab");
    },
    id: "im-tab-links__link-3",
  },
];

const navWrapperOptions: NavWrapper = {
  role: "navigation",
  id: "menu-example",
  className: "fr-nav fr-nav--example",
  ariaLabel: "Menu example",
};

const componentStory: ComponentStory<typeof Component> = () => (
  <Component navLinks={navLinks} navWrapper={navWrapperOptions} />
);

export const Basic = componentStory.bind({});
