import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { linkPrefix } from "../../storyPrefixes";
import { Link, LinkContract } from "./Link";

const Component = Link;
const prefix = linkPrefix;
const argTypes: Partial<ArgTypes<LinkContract>> | undefined = {};

export default {
  title: `${prefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
