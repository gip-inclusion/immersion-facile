import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { NavLink, tabLinksPrefix } from ".";
import { TabLinks } from "./TabLinks";

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
    link: {
      href: "#1",
      onClick: (e) => {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log("clicked firstTab");
      },
    },
  },
  {
    label: "My second tab",
    link: {
      href: "#2",
      onClick: (e) => {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log("clicked second Tab");
      },
    },
  },
  {
    label: "My third tab",
    link: {
      href: "#3",
      onClick: (e) => {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log("clicked third Tab");
      },
    },
  },
];

const componentStory: ComponentStory<typeof Component> = () => (
  <Component navLinks={navLinks} />
);

export const Basic = componentStory.bind({});
