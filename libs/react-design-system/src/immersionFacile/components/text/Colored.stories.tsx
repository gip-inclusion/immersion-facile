import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { textPrefix } from ".";
import { Colored, ColoredProps } from "./Colored";

const Component = Colored;
const argTypes: Partial<ArgTypes<ColoredProps>> | undefined = {};

export default {
  title: `${textPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  children: "Default",
};
