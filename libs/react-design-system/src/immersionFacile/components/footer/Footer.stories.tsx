import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { footerPrefix } from ".";
import { Footer, FooterProps } from "./Footer";

const Component = Footer;
const argTypes: Partial<ArgTypes<FooterProps>> | undefined = {};

export default {
  title: `${footerPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  links: [
    {
      label: "Footer link 1",
      href: "#link-1",
      display: true,
    },
    {
      label: "Footer link 2",
      href: "#link-2",
      display: true,
    },
  ],
  bottomLinks: [
    {
      label: "Bottom link 1",
      href: "#link-1",
      target: "_blank",
      display: true,
    },
    {
      label: "Bottom link 2",
      href: "#link-2",
      display: true,
    },
    {
      label: "Bottom link 3",
      href: "#link-3",
      target: "_blank",
      display: true,
    },
    {
      label: "Bottom link 4",
      href: "#link-4",
      display: true,
    },
  ],
};
