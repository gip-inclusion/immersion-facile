import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { Image, ImageProps } from "./Image";
import { imagePrefix } from ".";

const Component = Image;
const argTypes: Partial<ArgTypes<ImageProps>> | undefined = {};

export default {
  title: `${imagePrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
