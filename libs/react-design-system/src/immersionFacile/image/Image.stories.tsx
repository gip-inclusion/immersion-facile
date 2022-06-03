import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Image, ImageProps } from "./Image";

const Component = Image;

const argTypes: Partial<ArgTypes<ImageProps>> | undefined = {};
export default {
  title: `Immersion Facilité/${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;
const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
