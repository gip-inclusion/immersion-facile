import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import { Colored, ColoredProps } from "./Colored";
import { textPrefix } from ".";

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
