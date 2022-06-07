import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { imagePrefix } from "../../storyPrefixes";
import { Image, ImageProps } from "./Image";

const Component = Image;
const prefix = imagePrefix;
const argTypes: Partial<ArgTypes<ImageProps>> | undefined = {};

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
