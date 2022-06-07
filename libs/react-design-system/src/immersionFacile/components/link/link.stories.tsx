import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { linkPrefix } from ".";
import { Link, LinkContract } from "./Link";

const Component = Link;
const argTypes: Partial<ArgTypes<LinkContract>> | undefined = {};

export default {
  title: `${linkPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
